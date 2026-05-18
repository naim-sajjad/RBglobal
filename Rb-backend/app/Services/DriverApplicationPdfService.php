<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\ReferenceCheck;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DriverApplicationPdfService
{
    public static function download(Driver $driver): Response
    {
        $driver->loadMissing(['user', 'tenant', 'driverClass']);

        $c = self::parseCompliance($driver->compliance_notes);

        $referenceChecks = ReferenceCheck::query()
            ->where('driver_id', $driver->id)
            ->orderBy('id')
            ->get();

        $licenseFrontRelative = Driver::normalizePublicRelativePath($driver->license_front_image_path);
        $licenseBackRelative = Driver::normalizePublicRelativePath($driver->license_back_image_path);

        $licenseFrontUrl = self::storagePublicUrl($licenseFrontRelative);
        $licenseBackUrl = self::storagePublicUrl($licenseBackRelative);

        $licenseFrontEmbedded = self::diskImageAsDataUri($driver->license_front_image_path);
        $licenseBackEmbedded = self::diskImageAsDataUri($driver->license_back_image_path);

        $filename = self::pdfFilename($driver);

        $pdf = Pdf::loadView('pdf.driver-application', [
            'title' => 'Driver Employment Application',
            'generatedAt' => Carbon::now(),
            'driver' => $driver,
            'c' => $c,
            'referenceChecks' => $referenceChecks,
            'licenseFrontUrl' => $licenseFrontUrl,
            'licenseBackUrl' => $licenseBackUrl,
            'licenseFrontEmbedded' => $licenseFrontEmbedded,
            'licenseBackEmbedded' => $licenseBackEmbedded,
        ])
            ->setPaper('a4', 'portrait')
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false);

        return $pdf->download($filename);
    }

    private static function pdfFilename(Driver $driver): string
    {
        $name = $driver->user->name ?? 'Driver';
        $slug = Str::slug($name, '_');
        $slug = $slug !== '' ? $slug : 'Driver';
        $date = Carbon::now()->format('Y-m-d');

        return "Driver_Application_{$slug}_{$date}.pdf";
    }

    private static function storagePublicUrl(?string $normalizedRelative): ?string
    {
        if ($normalizedRelative === null || $normalizedRelative === '') {
            return null;
        }

        return Storage::disk('public')->url($normalizedRelative);
    }

    /**
     * DomPDF renders embedded images reliably from data URIs read from disk
     * (same paths as Storage::url() uses for display in the browser).
     */
    private static function diskImageAsDataUri(?string $storedPath): ?string
    {
        $rel = Driver::normalizePublicRelativePath($storedPath);
        if ($rel === null || ! Storage::disk('public')->exists($rel)) {
            return null;
        }

        $ext = strtolower((string) pathinfo($rel, PATHINFO_EXTENSION));
        $mime = match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            default => null,
        };
        if ($mime === null) {
            return null;
        }

        $bytes = Storage::disk('public')->get($rel);

        return 'data:'.$mime.';base64,'.base64_encode($bytes);
    }

    /**
     * @return array<string, mixed>
     */
    private static function defaultCompliance(): array
    {
        return [
            'personal' => [
                'middle_initial' => '',
                'gender' => '',
                'date_of_birth' => '',
                'work_eligibility_canada' => '',
                'education' => '',
                'medical_limitations' => '',
                'medical_limitations_explanation' => '',
            ],
            'address' => [
                'current_address' => '',
                'current_address_living_since' => '',
                'city' => '',
                'province' => '',
                'postal_code' => '',
                'cell_phone' => '',
                'previous_addresses' => [],
            ],
            'license' => [
                'license_province' => '',
                'license_class' => '',
                'license_endorsements' => '',
                'license_conditions' => '',
            ],
            'questions' => [
                'license_denied' => '',
                'privileges_revoked' => '',
                'dangerous_goods_certificate' => '',
            ],
            'driving_experience' => [
                'equipment_used' => [],
                'accident_history' => [
                    'ever_had_accidents' => '',
                    'number_of_incidents' => '',
                    'accident_explanation' => '',
                ],
                'traffic_violations' => [],
            ],
            'employment_history' => [
                'current_employer' => self::blankEmployer(),
                'previous_employers' => [],
            ],
            'existing_notes' => '',
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function blankEmployer(): array
    {
        return [
            'company' => '',
            'supervisor' => '',
            'address' => '',
            'phone' => '',
            'position' => '',
            'start_date' => '',
            'end_date' => '',
            'reasons_for_leaving' => '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function parseCompliance(?string $raw): array
    {
        $base = self::defaultCompliance();
        if ($raw === null || trim($raw) === '') {
            return $base;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return $base;
        }

        /** @var array<string, mixed> $merged */
        $merged = array_replace_recursive($base, $decoded);

        if (($merged['employment_history']['current_employer'] ?? null) !== null && is_array($merged['employment_history']['current_employer'])) {
            $merged['employment_history']['current_employer'] = array_merge(
                self::blankEmployer(),
                $merged['employment_history']['current_employer'],
            );
        } else {
            $merged['employment_history']['current_employer'] = self::blankEmployer();
        }

        return $merged;
    }
}
