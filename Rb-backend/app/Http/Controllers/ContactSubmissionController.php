<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactSubmissionRequest;
use App\Http\Requests\UpdateContactSubmissionStatusRequest;
use App\Models\ContactSubmission;
use App\Models\ImportBatch;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactSubmissionController extends Controller
{
    private const IMPORT_HEADERS = [
        'First Name',
        'Last Name',
        'Email 1',
        'Email 2',
        'Phone 1',
        'Phone 2',
        'Created At (UTC+0)',
        'Email subscriber status',
        'SMS subscriber status',
        'Last Activity',
        'Last Activity Date (UTC+0)',
        'Source',
        'Language',
    ];

    public function store(StoreContactSubmissionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $name = trim($validated['firstName'].' '.$validated['lastName']);
        $submittedAt = now();
        $language = $this->requestLanguage($request);

        $submission = ContactSubmission::create([
            'first_name' => $validated['firstName'],
            'last_name' => $validated['lastName'],
            'name' => $name,
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'location' => $validated['location'],
            'role' => $validated['role'],
            'form_key' => $validated['role'] === 'employer' ? 'employer_contact' : 'job_seeker_contact',
            'form_name' => $validated['role'] === 'employer' ? 'Employer Contact Form' : 'Job Seeker Contact Us Form',
            'subject' => ucfirst($validated['role']).' enquiry from '.$name,
            'message' => $validated['message'],
            'status' => ContactSubmission::STATUS_UNREAD,
            // Keep live website submissions consistent with imported contact exports.
            'original_created_at' => $submittedAt,
            'email_subscriber_status' => 'Never subscribed',
            'sms_subscriber_status' => 'Never subscribed',
            'last_activity' => 'Submitted a form',
            'last_activity_at' => $submittedAt,
            'source' => 'Form Submission',
            'language' => $language,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your message has been submitted successfully.',
            'data' => [
                'id' => $submission->id,
            ],
        ], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 20), 1), 100);
        $submissions = $this->filteredQuery($request)->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $submissions->items(),
            'meta' => [
                'current_page' => $submissions->currentPage(),
                'last_page' => $submissions->lastPage(),
                'per_page' => $submissions->perPage(),
                'total' => $submissions->total(),
            ],
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'skip_duplicates' => ['nullable', 'boolean'],
        ]);

        $file = $validated['file'];
        $handle = fopen($file->getRealPath(), 'rb');

        if (! $handle) {
            return response()->json(['message' => 'Unable to read the uploaded CSV file.'], 422);
        }

        $headers = $this->readCsvHeaders($handle);
        if (! $this->headersMatch($headers)) {
            fclose($handle);
            return response()->json([
                'message' => 'The CSV headers do not match the expected contact import format.',
                'expected_headers' => self::IMPORT_HEADERS,
                'detected_headers' => $headers,
            ], 422);
        }

        $storedFilename = $file->storeAs('contact-imports', uniqid('contacts-', true).'.csv', 'local');
        $batch = ImportBatch::create([
            'type' => ImportBatch::TYPE_CONTACTS,
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'status' => ImportBatch::STATUS_PROCESSING,
            'imported_by' => $request->user()?->id,
            'started_at' => now(),
        ]);

        $stats = ['total' => 0, 'imported' => 0, 'duplicates' => 0, 'failed' => 0];
        $errors = [];
        $chunk = [];
        $rowNumber = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if ($this->isEmptyCsvRow($row)) {
                continue;
            }

            $stats['total']++;
            $mapped = $this->mapImportRow($headers, $row);
            $normalized = $this->normalizeImportRow($mapped);
            $validator = Validator::make($normalized, $this->importRowRules());

            if ($validator->fails() || ! $this->hasMeaningfulIdentifier($normalized)) {
                $stats['failed']++;
                $errors[] = $this->errorRow($rowNumber, $mapped, $validator->errors()->all() ?: ['At least one identifier is required.']);
                continue;
            }

            if ($this->isDuplicateContact($normalized)) {
                $stats['duplicates']++;
                continue;
            }

            $chunk[] = $this->contactPayloadFromImport($normalized, $batch, $request);
            if (count($chunk) >= 100) {
                DB::transaction(fn () => ContactSubmission::insert($chunk));
                $stats['imported'] += count($chunk);
                $chunk = [];
            }
        }

        if ($chunk) {
            DB::transaction(fn () => ContactSubmission::insert($chunk));
            $stats['imported'] += count($chunk);
        }

        fclose($handle);

        $errorPath = $errors ? $this->writeErrorCsv($batch, $errors) : null;
        $batch->forceFill([
            'status' => $errors ? ImportBatch::STATUS_COMPLETED_WITH_ERRORS : ImportBatch::STATUS_COMPLETED,
            'total_rows' => $stats['total'],
            'imported_rows' => $stats['imported'],
            'duplicate_rows' => $stats['duplicates'],
            'skipped_rows' => $stats['duplicates'] + $stats['failed'],
            'failed_rows' => $stats['failed'],
            'error_file_path' => $errorPath,
            'completed_at' => now(),
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'Contact import completed.',
            'data' => $this->importResult($batch->fresh()),
        ]);
    }

    public function previewImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $handle = fopen($validated['file']->getRealPath(), 'rb');
        if (! $handle) {
            return response()->json(['message' => 'Unable to read the uploaded CSV file.'], 422);
        }

        $headers = $this->readCsvHeaders($handle);
        $rows = [];
        $rowNumber = 1;
        while (($row = fgetcsv($handle)) !== false && count($rows) < 10) {
            $rowNumber++;
            if ($this->isEmptyCsvRow($row)) {
                continue;
            }
            $mapped = $this->mapImportRow($headers, $row);
            $normalized = $this->normalizeImportRow($mapped);
            $rows[] = [
                'row' => $rowNumber,
                'values' => $normalized,
                'duplicate' => $this->isDuplicateContact($normalized),
            ];
        }
        fclose($handle);

        return response()->json([
            'success' => true,
            'data' => [
                'headers_valid' => $this->headersMatch($headers),
                'expected_headers' => self::IMPORT_HEADERS,
                'detected_headers' => $headers,
                'sample_rows' => $rows,
            ],
        ]);
    }

    public function imports(Request $request): JsonResponse
    {
        $imports = ImportBatch::query()
            ->with('importer:id,name,email')
            ->where('type', ImportBatch::TYPE_CONTACTS)
            ->latest()
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => $imports->items(),
            'meta' => [
                'current_page' => $imports->currentPage(),
                'last_page' => $imports->lastPage(),
                'per_page' => $imports->perPage(),
                'total' => $imports->total(),
            ],
        ]);
    }

    public function importShow(ImportBatch $importBatch): JsonResponse
    {
        abort_unless($importBatch->type === ImportBatch::TYPE_CONTACTS, 404);

        return response()->json(['success' => true, 'data' => $importBatch->load('importer:id,name,email')]);
    }

    public function importErrors(ImportBatch $importBatch): StreamedResponse|JsonResponse
    {
        abort_unless($importBatch->type === ImportBatch::TYPE_CONTACTS, 404);

        if (! $importBatch->error_file_path || ! Storage::disk('local')->exists($importBatch->error_file_path)) {
            return response()->json(['message' => 'No error file is available for this import.'], 404);
        }

        return Storage::disk('local')->download($importBatch->error_file_path, "contact-import-errors-{$importBatch->id}.csv", [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filename = 'contact-submissions-'.now()->format('Y-m-d-His').'.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($request): void {
            $output = fopen('php://output', 'wb');
            // Use the same format accepted by import so exports are round-trip compatible.
            fputcsv($output, self::IMPORT_HEADERS);

            $this->filteredQuery($request)->chunk(500, function ($contacts) use ($output): void {
                foreach ($contacts as $contact) {
                    fputcsv($output, array_map(fn ($value) => $this->csvCell($value), [
                        $contact->first_name,
                        $contact->last_name,
                        $contact->email,
                        $contact->secondary_email,
                        $contact->phone,
                        $contact->secondary_phone,
                        optional($contact->original_created_at ?? $contact->created_at)->utc()->format('Y-m-d H:i'),
                        $contact->email_subscriber_status,
                        $contact->sms_subscriber_status,
                        $contact->last_activity,
                        optional($contact->last_activity_at ?? $contact->created_at)->utc()->format('Y-m-d H:i'),
                        $contact->source,
                        $contact->language,
                    ]));
                }
            });

            fclose($output);
        }, 200, $headers);
    }

    public function importTemplate(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'wb');
            fputcsv($output, self::IMPORT_HEADERS);
            fputcsv($output, [
                'Sample', 'Contact', 'sample@example.com', '', '+1 437-555-0100', '',
                '2026-01-01 12:00', 'Never subscribed', 'Never subscribed',
                'Submitted a form', '2026-01-01 12:00', 'Form Submission', 'en',
            ]);
            fclose($output);
        }, 'contact-import-template.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function show(ContactSubmission $contactSubmission): JsonResponse
    {
        if ($contactSubmission->status === ContactSubmission::STATUS_UNREAD) {
            $this->applyStatus($contactSubmission, ContactSubmission::STATUS_READ);
        }

        return response()->json([
            'success' => true,
            'data' => $contactSubmission->fresh(),
        ]);
    }

    public function updateStatus(
        UpdateContactSubmissionStatusRequest $request,
        ContactSubmission $contactSubmission
    ): JsonResponse {
        $this->applyStatus($contactSubmission, $request->validated('status'));

        return response()->json([
            'success' => true,
            'message' => 'Contact submission status updated successfully.',
            'data' => $contactSubmission->fresh(),
        ]);
    }

    public function destroy(Request $request, ContactSubmission $contactSubmission): JsonResponse
    {
        $contactSubmission->forceFill([
            'deleted_by' => $request->user()?->id,
            'restored_by' => null,
        ])->save();
        $contactSubmission->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contact submission moved to Trash.',
        ]);
    }

    private function applyStatus(ContactSubmission $contactSubmission, string $status): void
    {
        $contactSubmission->forceFill([
            'status' => $status,
            'read_at' => $status === ContactSubmission::STATUS_READ
                ? ($contactSubmission->read_at ?? now())
                : $contactSubmission->read_at,
        ])->save();
    }

    private function filteredQuery(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');
        $source = $request->query('source');

        return ContactSubmission::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('secondary_email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('secondary_phone', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('source', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, [ContactSubmission::STATUS_UNREAD, ContactSubmission::STATUS_READ, ContactSubmission::STATUS_ARCHIVED], true), fn ($query) => $query->where('status', $status))
            ->when($source, fn ($query) => $query->where('source', $source))
            ->when($request->boolean('imported_only'), fn ($query) => $query->whereNotNull('imported_at'))
            ->when($request->query('import_batch_id'), fn ($query, $batchId) => $query->where('import_batch_id', $batchId))
            ->when($request->query('date_from'), fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($request->query('date_to'), fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latestSubmissions();
    }

    private function readCsvHeaders($handle): array
    {
        $headers = fgetcsv($handle) ?: [];
        if (isset($headers[0])) {
            $headers[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $headers[0]);
        }

        return array_map(fn ($header) => trim((string) $header), $headers);
    }

    private function headersMatch(array $headers): bool
    {
        return array_map([$this, 'normalizeHeader'], $headers) === array_map([$this, 'normalizeHeader'], self::IMPORT_HEADERS);
    }

    private function normalizeHeader(string $header): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $header)));
    }

    private function mapImportRow(array $headers, array $row): array
    {
        $mapped = [];
        foreach ($headers as $index => $header) {
            $mapped[$header] = $row[$index] ?? null;
        }

        return $mapped;
    }

    private function normalizeImportRow(array $row): array
    {
        return [
            'first_name' => $this->clean($row['First Name'] ?? null),
            'last_name' => $this->clean($row['Last Name'] ?? null),
            'email' => $this->cleanEmail($row['Email 1'] ?? null),
            'secondary_email' => $this->cleanEmail($row['Email 2'] ?? null),
            'phone' => $this->cleanPhone($row['Phone 1'] ?? null),
            'secondary_phone' => $this->cleanPhone($row['Phone 2'] ?? null),
            'original_created_at' => $this->parseCsvDate($row['Created At (UTC+0)'] ?? null),
            'email_subscriber_status' => $this->clean($row['Email subscriber status'] ?? null),
            'sms_subscriber_status' => $this->clean($row['SMS subscriber status'] ?? null),
            'last_activity' => $this->clean($row['Last Activity'] ?? null),
            'last_activity_at' => $this->parseCsvDate($row['Last Activity Date (UTC+0)'] ?? null),
            'source' => $this->clean($row['Source'] ?? null),
            'language' => $this->clean($row['Language'] ?? null),
        ];
    }

    private function importRowRules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:150'],
            'last_name' => ['nullable', 'string', 'max:150'],
            'email' => ['nullable', 'email', 'max:255'],
            'secondary_email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'secondary_phone' => ['nullable', 'string', 'max:50'],
            'source' => ['nullable', 'string', 'max:150'],
            'language' => ['nullable', 'string', 'max:20'],
            'email_subscriber_status' => ['nullable', 'string', 'max:100'],
            'sms_subscriber_status' => ['nullable', 'string', 'max:100'],
            'last_activity' => ['nullable', 'string', 'max:500'],
            'original_created_at' => ['nullable', 'date'],
            'last_activity_at' => ['nullable', 'date'],
        ];
    }

    private function hasMeaningfulIdentifier(array $row): bool
    {
        return filled($row['email']) || filled($row['phone']) || filled($row['first_name']) || filled($row['last_name']);
    }

    private function isDuplicateContact(array $row): bool
    {
        if (filled($row['email']) && ContactSubmission::where('email', $row['email'])->exists()) {
            return true;
        }

        if (! filled($row['email']) && filled($row['phone']) && ContactSubmission::where('phone', $row['phone'])->exists()) {
            return true;
        }

        if (filled($row['first_name']) && filled($row['last_name']) && filled($row['email'])) {
            return ContactSubmission::where('first_name', $row['first_name'])->where('last_name', $row['last_name'])->where('email', $row['email'])->exists();
        }

        if (filled($row['first_name']) && filled($row['last_name']) && filled($row['phone'])) {
            return ContactSubmission::where('first_name', $row['first_name'])->where('last_name', $row['last_name'])->where('phone', $row['phone'])->exists();
        }

        return false;
    }

    private function contactPayloadFromImport(array $row, ImportBatch $batch, Request $request): array
    {
        $now = now();
        $name = trim(($row['first_name'] ?? '').' '.($row['last_name'] ?? '')) ?: null;

        return [
            ...$row,
            'name' => $name,
            'location' => null,
            'role' => null,
            'subject' => 'Imported contact'.($name ? " from {$name}" : ''),
            'message' => null,
            'status' => ContactSubmission::STATUS_UNREAD,
            'import_batch_id' => $batch->id,
            'imported_at' => $now,
            'imported_by' => $request->user()?->id,
            'import_source_file' => $batch->original_filename,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function clean(mixed $value): ?string
    {
        $cleaned = trim((string) $value);
        return $cleaned === '' ? null : $cleaned;
    }

    private function cleanEmail(mixed $value): ?string
    {
        $email = strtolower((string) $this->clean($value));
        return $email === '' ? null : $email;
    }

    private function cleanPhone(mixed $value): ?string
    {
        $phone = $this->clean($value);
        if (! $phone) {
            return null;
        }

        $phone = ltrim($phone, "'");
        $phone = preg_replace('/[^\d+]/', '', $phone);
        return $phone ?: null;
    }

    private function parseCsvDate(mixed $value): ?Carbon
    {
        $date = $this->clean($value);
        if (! $date) {
            return null;
        }

        try {
            return Carbon::parse($date, 'UTC');
        } catch (\Throwable) {
            return null;
        }
    }

    private function isEmptyCsvRow(array $row): bool
    {
        return collect($row)->every(fn ($value) => trim((string) $value) === '');
    }

    private function errorRow(int $rowNumber, array $row, array $errors): array
    {
        return [
            'Row' => $rowNumber,
            'Errors' => implode('; ', $errors),
            ...$row,
        ];
    }

    private function writeErrorCsv(ImportBatch $batch, array $errors): string
    {
        $path = "contact-import-errors/contact-import-errors-{$batch->id}.csv";
        $handle = fopen('php://temp', 'rb+');
        fputcsv($handle, ['Row', 'Errors', ...self::IMPORT_HEADERS]);
        foreach ($errors as $error) {
            fputcsv($handle, array_map(fn ($header) => $error[$header] ?? '', ['Row', 'Errors', ...self::IMPORT_HEADERS]));
        }
        rewind($handle);
        Storage::disk('local')->put($path, stream_get_contents($handle));
        fclose($handle);

        return $path;
    }

    private function importResult(ImportBatch $batch): array
    {
        return [
            'batch_id' => $batch->id,
            'total_rows' => $batch->total_rows,
            'imported_rows' => $batch->imported_rows,
            'duplicate_rows' => $batch->duplicate_rows,
            'skipped_rows' => $batch->skipped_rows,
            'failed_rows' => $batch->failed_rows,
            'error_file_url' => $batch->error_file_path ? url("/api/admin/contact-imports/{$batch->id}/errors") : null,
        ];
    }

    private function csvCell(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        return preg_match('/^[=+\-@]/', $value) ? "'{$value}" : $value;
    }

    private function requestLanguage(Request $request): ?string
    {
        $language = trim((string) ($request->input('language') ?: $request->getPreferredLanguage()));
        if ($language === '') {
            return null;
        }

        return substr(str_replace('_', '-', $language), 0, 20);
    }
}
