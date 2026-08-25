<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\User;
use App\Services\DriverApplicationPdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DriverController extends Controller
{
    /**
     * Filter out attributes that don't exist as DB columns.
     * This prevents hard failures when a migration hasn't been applied yet.
     */
    private function filterToDriverTableColumns(array $attributes): array
    {
        static $driverColumns = null;

        if ($driverColumns === null) {
            $driverColumns = Schema::getColumnListing('drivers');
        }

        return array_intersect_key($attributes, array_flip($driverColumns));
    }

    /**
     * Get all drivers (admin only or tenant-scoped)
     */
    public function index(Request $request)
    {
        $currentUser = auth()->user();
        $query = Driver::with(['user.roles', 'user.permissions', 'tenant', 'driverClass']);

        // If tenant context is initialized, filter by tenant
        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        } elseif ($currentUser && $currentUser->is_global_admin) {
            // Super admin can see all drivers
        } else {
            // Regular users can only see drivers in their tenant
            if ($currentUser->tenants->isNotEmpty()) {
                $tenantIds = $currentUser->tenants->pluck('id')->toArray();
                $query->whereIn('tenant_id', $tenantIds);
            } else {
                return response()->json([]);
            }
        }

        $sortBy = $request->query('sort_by', 'created_at');
        $sortDir = strtolower((string) $request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $allowedSortBy = [
            'created_at' => 'created_at',
        ];
        $query->orderBy($allowedSortBy[$sortBy] ?? 'created_at', $sortDir);

        if ($request->filled('search')) {
            $term = mb_strtolower(trim((string) $request->query('search')));
            $like = '%' . addcslashes($term, '%_\\') . '%';
            $query->where(function ($qry) use ($like) {
                $qry->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(license_number) LIKE ?', [$like])
                    ->orWhereHas('user', function ($userQuery) use ($like) {
                        $userQuery->whereRaw('LOWER(name) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(email) LIKE ?', [$like]);
                    });
            });
        }

        $drivers = $query->get();
        return response()->json($drivers);
    }

    /**
     * Get current user's driver profile
     */
    public function myProfile()
    {
        $currentUser = auth()->user();

        // Find driver profile for current user
        $query = Driver::where('user_id', $currentUser->id);

        // If tenant context is initialized, filter by tenant
        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }

        $driver = $query->first();

        if (!$driver) {
            return response()->json(['message' => 'Driver profile not found'], 404);
        }

        return response()->json($driver->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']));
    }

    /**
     * Get a specific driver
     */
    public function show(Driver $driver)
    {
        $currentUser = auth()->user();

        // Check access: admin or driver viewing their own profile
        if (!$currentUser->is_global_admin && $driver->user_id !== $currentUser->id) {
            // Check if user has permission to view drivers
            if (!$currentUser->hasPermissionTo('drivers.view')) {
                abort(403, 'You do not have permission to view this driver');
            }
        }

        return response()->json($driver->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']));
    }

    /**
     * Employment application PDF (DomPDF): compliance JSON, uploads summary, licence photos, references.
     */
    public function applicationPdf(Driver $driver)
    {
        $currentUser = auth()->user();

        if (! $currentUser->is_global_admin && $driver->user_id !== $currentUser->id) {
            if (! $currentUser->hasPermissionTo('drivers.view')) {
                abort(403, 'You do not have permission to view this driver');
            }
        }

        return DriverApplicationPdfService::download($driver);
    }

    /**
     * Create driver (admin flow)
     */
    public function store(Request $request)
    {
        $currentUser = auth()->user();

        // Only admins can create drivers via this endpoint
        if (!$currentUser->hasPermissionTo('drivers.create') && !$currentUser->is_global_admin) {
            abort(403, 'You do not have permission to create drivers');
        }

        $validated = $this->validateDriverData($request, false, false, null);

        // Determine tenant
        $tenantId = null;
        if (tenant('id')) {
            $tenantId = tenant('id');
        } elseif ($request->has('tenant_id') && $currentUser->is_global_admin) {
            $tenantId = $request->tenant_id;
        }

        // Create or get user
        $user = null;
        if ($request->has('user_id') && $request->user_id) {
            $user = User::findOrFail($request->user_id);
        } else {
            // Create new user
            $user = User::create([
                'name' => $validated['name'],
                'email' => strtolower(trim((string) $validated['email'])),
                'password' => Hash::make($validated['password'] ?? 'temporary_password_123'),
                'is_global_admin' => false,
            ]);

            // Assign driver role
            $user->assignRole('driver');

            // Assign to tenant if provided
            if ($tenantId) {
                $user->tenants()->sync([$tenantId]);
            }
        }

        $driverAttributes = $this->filterToDriverTableColumns([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'email' => strtolower(trim((string) $validated['email'])),
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_other' => $validated['license_other'] ?? null,
            'issuing_authority' => $validated['issuing_authority'] ?? null,
            'license_issue_date' => $validated['license_issue_date'] ?? null,
            'license_expiry_date' => $validated['license_expiry_date'] ?? null,
            'vehicle_types' => $validated['vehicle_types'] ?? null,
            'background_check_status' => $validated['background_check_status'] ?? 'pending',
            'reference_check_status' => $validated['reference_check_status'] ?? 'pending',
            'compliance_notes' => $validated['compliance_notes'] ?? null,
            'status' => $validated['status'] ?? 'pending_approval', // Admin can set initial status
            'driver_class_id' => $validated['driver_class_id'] ?? null,
            'driver_class_effective_date' => $validated['driver_class_effective_date'] ?? null,
            'payee_business_name' => $validated['payee_business_name'] ?? null,
            'payee_address' => $validated['payee_address'] ?? null,
        ]);

        return DB::transaction(function () use ($request, $driverAttributes) {
            $driver = Driver::create($driverAttributes);
            $this->persistDriverDocumentPaths($driver, $this->handleDocumentUploads($request, $driver));

            return response()->json(
                $driver->fresh()->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']),
                201,
            );
        });
    }

    /**
     * Bulk import drivers from a CSV or first-sheet XLSX file.
     */
    public function import(Request $request)
    {
        $currentUser = auth()->user();

        if (!$currentUser->hasPermissionTo('drivers.create') && !$currentUser->is_global_admin) {
            abort(403, 'You do not have permission to import drivers');
        }

        $request->validate([
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, ['csv', 'xlsx'], true)) {
            return response()->json([
                'message' => 'Please upload a CSV or XLSX file.',
            ], 422);
        }

        try {
            $rows = $extension === 'xlsx'
                ? $this->readXlsxRows($file->getRealPath())
                : $this->readCsvRows($file->getRealPath());
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to read the uploaded driver sheet.',
            ], 422);
        }

        if (count($rows) < 2) {
            return response()->json([
                'message' => 'The uploaded sheet must include a header row and at least one driver row.',
            ], 422);
        }

        $headers = array_map(fn ($value) => $this->normalizeImportHeader((string) $value), array_shift($rows));
        $created = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];

        $tenantId = null;
        if (tenant('id')) {
            $tenantId = tenant('id');
        } elseif ($request->has('tenant_id') && $currentUser->is_global_admin) {
            $tenantId = $request->tenant_id;
        }

        DB::transaction(function () use ($rows, $headers, $tenantId, &$created, &$updated, &$skipped, &$errors) {
            foreach ($rows as $index => $row) {
                $rowNumber = $index + 2;
                $data = $this->mapImportRow($headers, $row);

                if ($this->isEmptyImportRow($data)) {
                    continue;
                }

                $name = trim((string) ($data['name'] ?? ''));
                $email = strtolower(trim((string) ($data['email'] ?? '')));

                if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $skipped++;
                    $errors[] = "Row {$rowNumber}: name and a valid email are required.";
                    continue;
                }

                $user = User::where('email', $email)->first();
                $userWasRecentlyCreated = false;

                if (!$user) {
                    $user = User::create([
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make((string) ($data['password'] ?? Str::random(16))),
                        'is_global_admin' => false,
                    ]);
                    $userWasRecentlyCreated = true;
                    $user->assignRole('driver');
                } elseif ($user->name !== $name) {
                    $user->update(['name' => $name]);
                }

                if ($tenantId) {
                    $user->tenants()->syncWithoutDetaching([$tenantId]);
                }

                $driver = Driver::where('user_id', $user->id)
                    ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
                    ->first();

                $driverAttributes = $this->filterToDriverTableColumns([
                    'user_id' => $user->id,
                    'tenant_id' => $driver?->tenant_id ?? $tenantId,
                    'name' => $name,
                    'email' => $email,
                    'license_number' => $this->blankToNull($data['license_number'] ?? null),
                    'license_type' => $this->normalizeLicenseType($data['license_type'] ?? null),
                    'license_other' => $this->blankToNull($data['license_other'] ?? null),
                    'issuing_authority' => $this->blankToNull($data['issuing_authority'] ?? null),
                    'license_issue_date' => $this->normalizeImportDate($data['license_issue_date'] ?? null),
                    'license_expiry_date' => $this->normalizeImportDate($data['license_expiry_date'] ?? null),
                    'vehicle_types' => $this->normalizeVehicleTypes($data['vehicle_types'] ?? null),
                    'background_check_status' => $this->normalizeCheckStatus($data['background_check_status'] ?? null),
                    'reference_check_status' => $this->normalizeCheckStatus($data['reference_check_status'] ?? null),
                    'compliance_notes' => $this->blankToNull($data['compliance_notes'] ?? null),
                    'status' => $this->normalizeDriverStatus($data['status'] ?? null),
                    'payee_business_name' => $this->blankToNull($data['payee_business_name'] ?? null),
                    'payee_address' => $this->blankToNull($data['payee_address'] ?? null),
                ]);

                $driverAttributes = array_filter(
                    $driverAttributes,
                    fn ($value, $key) => in_array($key, ['user_id', 'tenant_id'], true) || $value !== null,
                    ARRAY_FILTER_USE_BOTH,
                );

                if ($driver) {
                    $driver->update($driverAttributes);
                    $updated++;
                } else {
                    Driver::create(array_merge([
                        'background_check_status' => 'pending',
                        'reference_check_status' => 'pending',
                        'status' => 'pending_approval',
                    ], $driverAttributes));
                    $created++;
                }

                if (!$userWasRecentlyCreated && !$user->hasRole('driver')) {
                    $user->assignRole('driver');
                }
            }
        });

        return response()->json([
            'message' => "Driver import complete: {$created} created, {$updated} updated, {$skipped} skipped.",
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ]);
    }

    /**
     * Driver self-registration (public flow)
     */
    public function selfRegister(Request $request)
    {
        $validated = $this->validateDriverData($request, true, false, null);

        // Determine tenant from request or context
        $tenantId = null;
        if ($request->has('tenant_id')) {
            $tenantId = $request->tenant_id;
        } elseif (tenant('id')) {
            $tenantId = tenant('id');
        }

        // Create user account
        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim((string) $validated['email'])),
            'password' => Hash::make($validated['password']),
            'is_global_admin' => false,
        ]);

        // Assign driver role
        $user->assignRole('driver');

        // Assign to tenant if provided
        if ($tenantId) {
            $user->tenants()->sync([$tenantId]);
        }

        $driverAttributes = $this->filterToDriverTableColumns([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'email' => strtolower(trim((string) $validated['email'])),
            'license_number' => $validated['license_number'] ?? null,
            'license_type' => $validated['license_type'] ?? null,
            'license_other' => $validated['license_other'] ?? null,
            'issuing_authority' => $validated['issuing_authority'] ?? null,
            'license_issue_date' => $validated['license_issue_date'] ?? null,
            'license_expiry_date' => $validated['license_expiry_date'] ?? null,
            'vehicle_types' => $validated['vehicle_types'] ?? null,
            'background_check_status' => 'pending',
            'reference_check_status' => 'pending',
            'compliance_notes' => $validated['compliance_notes'] ?? null,
            'status' => 'pending_approval', // Always pending for self-registration
            'driver_class_id' => $validated['driver_class_id'] ?? null,
            'driver_class_effective_date' => $validated['driver_class_effective_date'] ?? null,
            'payee_business_name' => $validated['payee_business_name'] ?? null,
            'payee_address' => $validated['payee_address'] ?? null,
        ]);

        return DB::transaction(function () use ($request, $driverAttributes, $user) {
            $driver = Driver::create($driverAttributes);
            $this->persistDriverDocumentPaths($driver, $this->handleDocumentUploads($request, $driver));

            // Create auth token for immediate login
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'driver' => $driver->fresh()->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']),
                'user' => $user->load('roles', 'permissions', 'tenants'),
                'token' => $token,
                'message' => 'Driver registration successful. Your account is pending approval.',
            ], 201);
        });
    }

    /**
     * Update driver profile
     */
    public function update(Request $request, Driver $driver)
    {
        $currentUser = auth()->user();

        // Check access: admin or driver updating their own profile
        if (!$currentUser->is_global_admin && $driver->user_id !== $currentUser->id) {
            if (!$currentUser->hasPermissionTo('drivers.update')) {
                abort(403, 'You do not have permission to update this driver');
            }
        }

        // Normalize empty driver_class_id so clearing the class works (FormData sends empty string)
        if ($request->has('driver_class_id') && ($request->input('driver_class_id') === '' || $request->input('driver_class_id') === null)) {
            $request->merge(['driver_class_id' => null]);
        }

        $validated = $this->validateDriverData($request, false, true, $driver);

        // Handle document uploads
        $documentPaths = $this->handleDocumentUploads($request, $driver);

        // Merge document paths into validated data
        foreach ($documentPaths as $key => $path) {
            if ($path) {
                $validated[$key . '_path'] = $path;
            }
        }

        $nameForUser = $validated['name'] ?? null;
        $emailForUser = isset($validated['email'])
            ? strtolower(trim((string) $validated['email']))
            : null;
        $passwordPlain = isset($validated['password']) ? $validated['password'] : null;

        $stripKeys = [
            'password',
            'pcc_document',
            'license_document',
            'license_front_image',
            'license_back_image',
            'abstract_document',
            'cvor_document',
            'safety_certificate',
        ];
        foreach ($stripKeys as $stripKey) {
            unset($validated[$stripKey]);
        }

        if ($emailForUser !== null && $emailForUser !== '') {
            $validated['email'] = $emailForUser;
        }

        // Drivers can only update their own profile, not status or HR verification flags
        if ($driver->user_id === $currentUser->id && !$currentUser->is_global_admin) {
            unset($validated['status']); // Drivers can't change their own status
            unset($validated['reference_check_status']);
        }

        $driver->update($this->filterToDriverTableColumns($validated));

        $userUpdates = [];
        if ($nameForUser !== null && $nameForUser !== '') {
            $userUpdates['name'] = $nameForUser;
        }
        if ($emailForUser !== null && $emailForUser !== '') {
            $userUpdates['email'] = $emailForUser;
        }
        if (is_string($passwordPlain) && strlen($passwordPlain) >= 8) {
            $userUpdates['password'] = Hash::make($passwordPlain);
        }
        if ($userUpdates !== []) {
            $driver->user()->update($userUpdates);
        }

        return response()->json($driver->fresh()->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']));
    }

    /**
     * Approve driver (admin only)
     */
    public function approve(Driver $driver)
    {
        $currentUser = auth()->user();

        if (!$currentUser->hasPermissionTo('drivers.approve') && !$currentUser->is_global_admin) {
            abort(403, 'You do not have permission to approve drivers');
        }

        $driver->update(['status' => 'active']);

        return response()->json([
            'message' => 'Driver approved successfully',
            'driver' => $driver->load(['user.roles', 'user.permissions', 'tenant', 'driverClass']),
        ]);
    }

    /**
     * Delete driver
     */
    public function destroy(Driver $driver)
    {
        $currentUser = auth()->user();

        if (!$currentUser->hasPermissionTo('drivers.delete') && !$currentUser->is_global_admin) {
            abort(403, 'You do not have permission to delete drivers');
        }

        // Delete all documents if they exist
        $documentFields = [
            'pcc_document_path',
            'license_document_path',
            'license_front_image_path',
            'license_back_image_path',
            'abstract_document_path',
            'cvor_document_path',
            'safety_certificate_path',
        ];

        foreach ($documentFields as $field) {
            $rel = Driver::normalizePublicRelativePath($driver->$field ?? null);
            if ($rel !== null) {
                Storage::disk('public')->delete($rel);
            }
        }

        $driver->delete();

        return response()->json(['message' => 'Driver deleted successfully']);
    }

    private function readCsvRows(string $path): array
    {
        $rows = [];
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return [];
        }

        while (($row = fgetcsv($handle)) !== false) {
            $rows[] = $row;
        }

        fclose($handle);

        return $rows;
    }

    private function readXlsxRows(string $path): array
    {
        $entries = $this->readZipEntries($path);
        if ($entries === []) {
            return [];
        }

        $sharedStrings = $this->readXlsxSharedStrings($entries);
        $sheetXmlPath = $this->firstXlsxSheetPath($entries);
        $sheetXml = $sheetXmlPath ? ($entries[$sheetXmlPath] ?? false) : false;

        if (!is_string($sheetXml)) {
            return [];
        }

        $sheet = new \DOMDocument();
        if (!$sheet->loadXML($sheetXml, LIBXML_NONET)) {
            return [];
        }

        $rows = [];
        $xpath = new \DOMXPath($sheet);
        $xpath->registerNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $rowNodes = $xpath->query('//x:sheetData/x:row');

        foreach ($rowNodes as $rowNode) {
            $row = [];
            $cellNodes = $xpath->query('./x:c', $rowNode);

            foreach ($cellNodes as $cell) {
                $reference = $cell instanceof \DOMElement ? $cell->getAttribute('r') : '';
                $columnIndex = $this->xlsxColumnIndex($reference);
                $type = $cell instanceof \DOMElement ? $cell->getAttribute('t') : '';
                $value = '';

                if ($type === 's') {
                    $valueNode = $xpath->query('./x:v', $cell)->item(0);
                    $value = $sharedStrings[(int) ($valueNode?->textContent ?? 0)] ?? '';
                } elseif ($type === 'inlineStr') {
                    $textNode = $xpath->query('./x:is/x:t', $cell)->item(0);
                    $value = trim((string) ($textNode?->textContent ?? ''));
                } else {
                    $valueNode = $xpath->query('./x:v', $cell)->item(0);
                    $value = trim((string) ($valueNode?->textContent ?? ''));
                }

                if ($columnIndex !== null) {
                    $row[$columnIndex] = $value;
                }
            }

            if ($row !== []) {
                ksort($row);
                $denseRow = [];
                $maxIndex = max(array_keys($row));
                for ($i = 0; $i <= $maxIndex; $i++) {
                    $denseRow[] = $row[$i] ?? '';
                }
                $rows[] = $denseRow;
            }
        }

        return $rows;
    }

    private function readZipEntries(string $path): array
    {
        $contents = file_get_contents($path);
        if ($contents === false) {
            return [];
        }

        $eocdOffset = strrpos($contents, "PK\x05\x06");
        if ($eocdOffset === false) {
            return [];
        }

        $eocd = unpack('vdisk/vstartDisk/ventriesDisk/ventries/VcentralSize/VcentralOffset/vcommentLength', substr($contents, $eocdOffset + 4, 18));
        if (!is_array($eocd)) {
            return [];
        }

        $entries = [];
        $offset = (int) $eocd['centralOffset'];
        $end = $offset + (int) $eocd['centralSize'];

        while ($offset < $end && substr($contents, $offset, 4) === "PK\x01\x02") {
            $header = unpack(
                'vversionMade/vversionNeeded/vflags/vmethod/vtime/vdate/Vcrc/VcompressedSize/VuncompressedSize/vnameLength/vextraLength/vcommentLength/vdisk/vinternal/Vexternal/VlocalOffset',
                substr($contents, $offset + 4, 42),
            );

            if (!is_array($header)) {
                break;
            }

            $nameLength = (int) $header['nameLength'];
            $extraLength = (int) $header['extraLength'];
            $commentLength = (int) $header['commentLength'];
            $name = substr($contents, $offset + 46, $nameLength);
            $localOffset = (int) $header['localOffset'];

            if ($name !== '' && substr($contents, $localOffset, 4) === "PK\x03\x04") {
                $localHeader = unpack('vversion/vflags/vmethod/vtime/vdate/Vcrc/VcompressedSize/VuncompressedSize/vnameLength/vextraLength', substr($contents, $localOffset + 4, 26));

                if (is_array($localHeader)) {
                    $dataOffset = $localOffset + 30 + (int) $localHeader['nameLength'] + (int) $localHeader['extraLength'];
                    $compressedData = substr($contents, $dataOffset, (int) $header['compressedSize']);
                    $method = (int) $header['method'];

                    if ($method === 0) {
                        $entries[$name] = $compressedData;
                    } elseif ($method === 8) {
                        $inflated = gzinflate($compressedData);
                        if ($inflated !== false) {
                            $entries[$name] = $inflated;
                        }
                    }
                }
            }

            $offset += 46 + $nameLength + $extraLength + $commentLength;
        }

        return $entries;
    }

    private function readXlsxSharedStrings(array $entries): array
    {
        $xml = $entries['xl/sharedStrings.xml'] ?? null;
        if (!is_string($xml)) {
            return [];
        }

        $strings = [];
        $sharedStrings = new \DOMDocument();
        if (!$sharedStrings->loadXML($xml, LIBXML_NONET)) {
            return [];
        }

        $xpath = new \DOMXPath($sharedStrings);
        $xpath->registerNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $stringNodes = $xpath->query('//x:si');

        foreach ($stringNodes as $stringNode) {
            $directTextNode = $xpath->query('./x:t', $stringNode)->item(0);
            if ($directTextNode) {
                $strings[] = $directTextNode->textContent;
                continue;
            }

            $parts = [];
            $runTextNodes = $xpath->query('./x:r/x:t', $stringNode);
            foreach ($runTextNodes as $runTextNode) {
                $parts[] = $runTextNode->textContent;
            }
            $strings[] = implode('', $parts);
        }

        return $strings;
    }

    private function firstXlsxSheetPath(array $entries): ?string
    {
        $workbookXml = $entries['xl/workbook.xml'] ?? null;
        $relsXml = $entries['xl/_rels/workbook.xml.rels'] ?? null;

        if (!is_string($workbookXml) || !is_string($relsXml)) {
            return isset($entries['xl/worksheets/sheet1.xml']) ? 'xl/worksheets/sheet1.xml' : null;
        }

        $workbook = new \DOMDocument();
        $rels = new \DOMDocument();
        if (!$workbook->loadXML($workbookXml, LIBXML_NONET) || !$rels->loadXML($relsXml, LIBXML_NONET)) {
            return null;
        }

        $workbookXpath = new \DOMXPath($workbook);
        $workbookXpath->registerNamespace('x', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $workbookXpath->registerNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $firstSheet = $workbookXpath->query('//x:sheets/x:sheet')->item(0);
        $relationshipId = $firstSheet instanceof \DOMElement ? $firstSheet->getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') : '';

        $relsXpath = new \DOMXPath($rels);
        $relsXpath->registerNamespace('rel', 'http://schemas.openxmlformats.org/package/2006/relationships');
        $relationships = $relsXpath->query('//rel:Relationship');
        foreach ($relationships as $relationship) {
            if ($relationship instanceof \DOMElement && $relationship->getAttribute('Id') === $relationshipId) {
                $target = ltrim($relationship->getAttribute('Target'), '/');
                return str_starts_with($target, 'xl/') ? $target : 'xl/'.$target;
            }
        }

        return null;
    }

    private function xlsxColumnIndex(string $reference): ?int
    {
        if (!preg_match('/^([A-Z]+)/i', $reference, $matches)) {
            return null;
        }

        $letters = strtoupper($matches[1]);
        $index = 0;
        for ($i = 0; $i < strlen($letters); $i++) {
            $index = $index * 26 + (ord($letters[$i]) - 64);
        }

        return $index - 1;
    }

    private function normalizeImportHeader(string $header): string
    {
        $normalized = Str::of($header)->lower()->replaceMatches('/[^a-z0-9]+/', '_')->trim('_')->toString();

        return [
            'full_name' => 'name',
            'driver_name' => 'name',
            'email_address' => 'email',
            'licence_number' => 'license_number',
            'licence_type' => 'license_type',
            'licence_issue_date' => 'license_issue_date',
            'licence_expiry_date' => 'license_expiry_date',
            'license_expiration_date' => 'license_expiry_date',
            'licence_expiration_date' => 'license_expiry_date',
            'authority' => 'issuing_authority',
            'vehicle_type' => 'vehicle_types',
            'vehicle_types' => 'vehicle_types',
            'background_check' => 'background_check_status',
            'reference_check' => 'reference_check_status',
            'payee_name' => 'payee_business_name',
            'business_name' => 'payee_business_name',
        ][$normalized] ?? $normalized;
    }

    private function mapImportRow(array $headers, array $row): array
    {
        $mapped = [];
        foreach ($headers as $index => $header) {
            if ($header !== '') {
                $mapped[$header] = $row[$index] ?? null;
            }
        }

        return $mapped;
    }

    private function isEmptyImportRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }

    private function blankToNull(mixed $value): ?string
    {
        $value = trim((string) $value);
        return $value === '' ? null : $value;
    }

    private function normalizeImportDate(mixed $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return gmdate('Y-m-d', ((int) $value - 25569) * 86400);
        }

        $timestamp = strtotime($value);
        return $timestamp ? date('Y-m-d', $timestamp) : null;
    }

    private function normalizeLicenseType(mixed $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        $allowed = ['AZ', 'DZ', 'G-Class', 'G1/G2', 'Other'];
        foreach ($allowed as $type) {
            if (strcasecmp($type, $value) === 0) {
                return $type;
            }
        }

        return 'Other';
    }

    private function normalizeVehicleTypes(mixed $value): ?array
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        $allowed = ['Truck', 'Van', 'Trailer', 'Reefer', 'Flatbed'];
        $parts = preg_split('/[,;|]+/', $value) ?: [];
        $types = [];

        foreach ($parts as $part) {
            foreach ($allowed as $type) {
                if (strcasecmp(trim($part), $type) === 0) {
                    $types[] = $type;
                }
            }
        }

        return array_values(array_unique($types));
    }

    private function normalizeCheckStatus(mixed $value): ?string
    {
        $value = strtolower(trim((string) $value));
        if ($value === '') {
            return null;
        }

        return in_array($value, ['completed', 'complete', 'done', 'yes'], true) ? 'completed' : 'pending';
    }

    private function normalizeDriverStatus(mixed $value): ?string
    {
        $value = strtolower(trim((string) $value));
        if ($value === '') {
            return null;
        }

        $normalized = str_replace([' ', '-'], '_', $value);
        return in_array($normalized, ['pending_approval', 'active', 'inactive', 'suspended'], true)
            ? $normalized
            : 'pending_approval';
    }

    /**
     * Validate driver data
     */
    private function validateDriverData(Request $request, bool $isSelfRegister = false, bool $isUpdate = false, ?Driver $driver = null): array
    {
        $emailRules = ['required', 'string', 'email', 'max:255'];

        if ($isUpdate && $driver !== null) {
            $emailRules = ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($driver->user_id)];
        } elseif (!$isUpdate) {
            $emailRules[] = Rule::unique('users', 'email');
        }

        $rules = [
            // User info (required for new users)
            'name' => $isUpdate ? 'sometimes|required|string|max:255' : 'required|string|max:255',
            'email' => $emailRules,
            'password' => $isUpdate
                ? 'sometimes|string|min:8'
                : ($isSelfRegister ? 'required|string|min:8' : 'nullable|string|min:8'),

            // License Information
            'license_number' => ($isUpdate ? 'sometimes|required' : 'required') . '|string|max:255',
            'license_type' => [($isUpdate ? 'sometimes' : 'required'), Rule::in(['AZ', 'DZ', 'G-Class', 'G1/G2', 'Other'])],
            'license_other' => 'nullable|string|max:255|required_if:license_type,Other',
            'issuing_authority' => ($isUpdate ? 'sometimes|required' : 'required') . '|string|max:255',
            'license_issue_date' => ($isUpdate ? 'sometimes|required' : 'required') . '|date|before_or_equal:today',
            'license_expiry_date' => ($isUpdate ? 'sometimes|required' : 'required') . '|date|after_or_equal:today',

            // Vehicle Information
            'vehicle_types' => 'nullable|array',
            'vehicle_types.*' => ['nullable', Rule::in(['Truck', 'Van', 'Trailer', 'Reefer', 'Flatbed'])],

            // Compliance Requirements & Documents
            'pcc_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'license_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'license_front_image' => ($isUpdate ? 'nullable' : 'required') . '|file|mimes:jpg,jpeg,png|max:5120',
            'license_back_image' => ($isUpdate ? 'nullable' : 'required') . '|file|mimes:jpg,jpeg,png|max:5120',
            'abstract_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'cvor_document' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'safety_certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'background_check_status' => ['nullable', Rule::in(['pending', 'completed'])],
            'reference_check_status' => ['nullable', Rule::in(['pending', 'completed'])],
            'compliance_notes' => 'nullable|string',

            // Status (admin only)
            'status' => ['nullable', Rule::in(['pending_approval', 'active', 'inactive', 'suspended'])],

            // Driver class (pay tier) - required on create for contract-driven pricing; optional on update/self-register
            'driver_class_id' => ($isSelfRegister || $isUpdate ? 'nullable' : 'required') . '|integer|exists:driver_classes,id',
            'driver_class_effective_date' => 'nullable|date',

            'payee_business_name' => 'nullable|string|max:255',
            'payee_address' => 'nullable|string|max:4000',
        ];

        return $request->validate($rules);
    }

    /**
     * Handle document uploads
     */
    private function handleDocumentUploads(Request $request, ?Driver $driver = null): array
    {
        $documentPaths = [];
        $documentFields = [
            'pcc_document' => 'pcc',
            'license_document' => 'license',
            'license_front_image' => 'license',
            'license_back_image' => 'license',
            'abstract_document' => 'abstract',
            'cvor_document' => 'cvor',
            'safety_certificate' => 'safety',
        ];

        $disk = 'public';

        $basePrefix = ($driver !== null && $driver->exists)
            ? ('drivers/'.$driver->id)
            : 'drivers';

        foreach ($documentFields as $field => $subfolder) {
            if ($request->hasFile($field)) {
                if ($driver && $driver->{$field . '_path'}) {
                    $oldRelative = Driver::normalizePublicRelativePath($driver->{$field . '_path'});
                    if ($oldRelative !== null) {
                        Storage::disk($disk)->delete($oldRelative);
                    }
                }

                $documentPaths[$field] = $request->file($field)->store($basePrefix.'/'.$subfolder, $disk);
            }
        }

        return $documentPaths;
    }

    /**
     * @param  array<string, non-empty-string>  $pathsByFieldKey keys like "pcc_document" (no _path suffix)
     */
    private function persistDriverDocumentPaths(Driver $driver, array $pathsByFieldKey): void
    {
        if ($pathsByFieldKey === []) {
            return;
        }

        $patch = [];
        foreach ($pathsByFieldKey as $baseKey => $path) {
            if (is_string($path) && $path !== '') {
                $patch[$baseKey.'_path'] = $path;
            }
        }

        if ($patch === []) {
            return;
        }

        $driver->update($this->filterToDriverTableColumns($patch));
    }
}
