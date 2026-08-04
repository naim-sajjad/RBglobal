<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNewsletterSubscriptionRequest;
use App\Http\Requests\UpdateNewsletterSubscriberStatusRequest;
use App\Mail\NewsletterSubscriptionConfirmation;
use App\Models\ImportBatch;
use App\Models\NewsletterSubscriber;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NewsletterSubscriberController extends Controller
{
    private const IMPORT_HEADERS = [
        'Submission date',
        'Email',
        'Are you a job seeker or an employer?',
        'Yes, subscribe me to your newsletter.',
    ];

    public function store(StoreNewsletterSubscriptionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $email = strtolower(trim($validated['email']));
        $subscriber = NewsletterSubscriber::where('email', $email)->first();
        $subscriberType = $this->subscriberTypeFromRole($validated['role'] ?? null);
        $submittedAt = now();

        if ($subscriber?->status === NewsletterSubscriber::STATUS_ACTIVE) {
            return response()->json([
                'success' => true,
                'message' => 'This email is already subscribed.',
            ]);
        }

        if ($subscriber?->status === NewsletterSubscriber::STATUS_BLOCKED) {
            return response()->json([
                'success' => true,
                'message' => 'You have been subscribed successfully.',
            ]);
        }


        if ($subscriber) {
            $subscriber->forceFill([
                'name' => $validated['name'] ?? $subscriber->name,
                'role' => $validated['role'] ?? $subscriber->role,
                'subscriber_type' => $subscriberType ?? $subscriber->subscriber_type,
                'form_key' => 'subscribe',
                'form_name' => 'Subscribe Form',
                'consent' => true,
                'consent_at' => $subscriber->consent_at ?? $submittedAt,
                'source' => $validated['source'] ?? $subscriber->source ?? 'website',
                'original_submitted_at' => $subscriber->original_submitted_at ?? $submittedAt,
                'status' => NewsletterSubscriber::STATUS_ACTIVE,
                'subscribed_at' => $submittedAt,
                'unsubscribed_at' => null,
            ])->save();
        } else {
            $subscriber = NewsletterSubscriber::create([
                'email' => $email,
                'name' => $validated['name'] ?? null,
                'role' => $validated['role'] ?? null,
                'subscriber_type' => $subscriberType,
                'form_key' => 'subscribe',
                'form_name' => 'Subscribe Form',
                'consent' => true,
                'consent_at' => $submittedAt,
                'source' => $validated['source'] ?? 'website',
                'original_submitted_at' => $submittedAt,
                'status' => NewsletterSubscriber::STATUS_ACTIVE,
                'subscribed_at' => $submittedAt,
            ]);
        }

        try {
            Mail::to($subscriber->email)->send(new NewsletterSubscriptionConfirmation($subscriber));
        } catch (\Throwable $exception) {
            // A temporary mail transport problem must not undo a valid subscription.
            Log::warning('Newsletter confirmation email could not be sent.', [
                'subscriber_id' => $subscriber->id,
                'email' => $subscriber->email,
                'error' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'You have been subscribed successfully.',
        ], 201);
    }

    public function unsubscribe(string $token): JsonResponse
    {
        $subscriber = NewsletterSubscriber::where('unsubscribe_token', $token)->firstOrFail();
        $this->applyStatus($subscriber, NewsletterSubscriber::STATUS_UNSUBSCRIBED);

        return response()->json([
            'success' => true,
            'message' => 'You have been unsubscribed successfully.',
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $subscribers = $this->filteredQuery($request)
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return response()->json([
            'success' => true,
            'data' => $subscribers->items(),
            'meta' => [
                'current_page' => $subscribers->currentPage(),
                'last_page' => $subscribers->lastPage(),
                'per_page' => $subscribers->perPage(),
                'total' => $subscribers->total(),
            ],
        ]);
    }

    public function show(NewsletterSubscriber $newsletterSubscriber): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $newsletterSubscriber,
        ]);
    }

    public function updateStatus(
        UpdateNewsletterSubscriberStatusRequest $request,
        NewsletterSubscriber $newsletterSubscriber
    ): JsonResponse {
        $this->applyStatus($newsletterSubscriber, $request->validated('status'));

        return response()->json([
            'success' => true,
            'message' => 'Newsletter subscriber status updated successfully.',
            'data' => $newsletterSubscriber->fresh(),
        ]);
    }

    public function destroy(Request $request, NewsletterSubscriber $newsletterSubscriber): JsonResponse
    {
        $newsletterSubscriber->forceFill([
            'deleted_by' => $request->user()?->id,
            'restored_by' => null,
        ])->save();
        $newsletterSubscriber->delete();

        return response()->json([
            'success' => true,
            'message' => 'Newsletter subscriber moved to Trash.',
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filename = 'newsletter-subscribers-'.now()->format('Y-m-d-His').'.csv';
        $query = $this->filteredQuery($request);

        return response()->streamDownload(function () use ($query): void {
            $handle = fopen('php://output', 'w');
            // Export in the same format accepted by import.
            fputcsv($handle, self::IMPORT_HEADERS);

            $query->chunk(200, function ($subscribers) use ($handle): void {
                foreach ($subscribers as $subscriber) {
                    fputcsv($handle, array_map(fn ($value) => $this->csvCell($value), [
                        optional($subscriber->original_submitted_at ?? $subscriber->created_at)->utc()->toISOString(),
                        $subscriber->email,
                        $this->subscriberTypeForExport($subscriber->subscriber_type ?? $subscriber->role),
                        $subscriber->consent && $subscriber->status === NewsletterSubscriber::STATUS_ACTIVE
                            ? 'Checked'
                            : 'Unchecked',
                    ]));
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'mode' => ['nullable', 'string', 'in:skip_duplicates,update_empty_fields,reactivate_consented'],
        ]);

        $mode = $validated['mode'] ?? 'skip_duplicates';
        $file = $validated['file'];
        $handle = fopen($file->getRealPath(), 'rb');
        if (! $handle) {
            return response()->json(['message' => 'Unable to read the uploaded CSV file.'], 422);
        }

        $headers = $this->readCsvHeaders($handle);
        if (! $this->headersMatch($headers)) {
            fclose($handle);
            return response()->json([
                'message' => 'The CSV headers do not match the expected newsletter import format.',
                'expected_headers' => self::IMPORT_HEADERS,
                'detected_headers' => $headers,
            ], 422);
        }

        $storedFilename = $file->storeAs('newsletter-imports', uniqid('newsletter-', true).'.csv', 'local');
        $batch = ImportBatch::create([
            'type' => ImportBatch::TYPE_NEWSLETTER_SUBSCRIBERS,
            'original_filename' => $file->getClientOriginalName(),
            'stored_filename' => $storedFilename,
            'status' => ImportBatch::STATUS_PROCESSING,
            'imported_by' => $request->user()?->id,
            'started_at' => now(),
        ]);

        $stats = ['total' => 0, 'imported' => 0, 'duplicates' => 0, 'failed' => 0, 'active' => 0, 'non_consented' => 0];
        $errors = [];
        $chunk = [];
        $seenEmails = [];
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

            if ($validator->fails()) {
                $stats['failed']++;
                $errors[] = $this->errorRow($rowNumber, $mapped, $validator->errors()->all());
                continue;
            }

            if (isset($seenEmails[$normalized['email']])) {
                $stats['duplicates']++;
                continue;
            }

            $seenEmails[$normalized['email']] = true;

            if (! $normalized['consent']) {
                $stats['non_consented']++;
            }

            $existing = NewsletterSubscriber::where('email', $normalized['email'])->first();
            if ($existing) {
                $changed = $this->handleExistingSubscriber($existing, $normalized, $mode, $batch, $request);
                if ($changed) {
                    if ($existing->status === NewsletterSubscriber::STATUS_ACTIVE) {
                        $stats['active']++;
                    }
                } else {
                    $stats['duplicates']++;
                }
                continue;
            }

            $payload = $this->subscriberPayloadFromImport($normalized, $batch, $request);
            if ($payload['status'] === NewsletterSubscriber::STATUS_ACTIVE) {
                $stats['active']++;
            }
            $chunk[] = $payload;
            if (count($chunk) >= 100) {
                DB::transaction(fn () => NewsletterSubscriber::insert($chunk));
                $stats['imported'] += count($chunk);
                $chunk = [];
            }
        }

        if ($chunk) {
            DB::transaction(fn () => NewsletterSubscriber::insert($chunk));
            $stats['imported'] += count($chunk);
        }

        fclose($handle);

        $errorPath = $errors ? $this->writeErrorCsv($batch, $errors) : null;
        $batch->forceFill([
            'status' => $errors ? ImportBatch::STATUS_COMPLETED_WITH_ERRORS : ImportBatch::STATUS_COMPLETED,
            'total_rows' => $stats['total'],
            'imported_rows' => $stats['imported'],
            'duplicate_rows' => $stats['duplicates'],
            'active_rows' => $stats['active'],
            'non_consented_rows' => $stats['non_consented'],
            'skipped_rows' => $stats['duplicates'] + $stats['failed'],
            'failed_rows' => $stats['failed'],
            'error_file_path' => $errorPath,
            'completed_at' => now(),
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'Newsletter subscriber import completed.',
            'data' => $this->importResult($batch->fresh(), $stats),
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
        $active = 0;
        $nonConsented = 0;
        $rowNumber = 1;

        while (($row = fgetcsv($handle)) !== false && count($rows) < 20) {
            $rowNumber++;
            if ($this->isEmptyCsvRow($row)) {
                continue;
            }
            $mapped = $this->mapImportRow($headers, $row);
            $normalized = $this->normalizeImportRow($mapped);
            $duplicate = filled($normalized['email']) && NewsletterSubscriber::where('email', $normalized['email'])->exists();
            $normalized['consent'] ? $active++ : $nonConsented++;
            $validator = Validator::make($normalized, $this->importRowRules());
            $rows[] = [
                'row' => $rowNumber,
                'values' => $normalized,
                'duplicate' => $duplicate,
                'errors' => $validator->errors()->all(),
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
                'active_rows' => $active,
                'non_consented_rows' => $nonConsented,
            ],
        ]);
    }

    public function imports(Request $request): JsonResponse
    {
        $imports = ImportBatch::query()
            ->with('importer:id,name,email')
            ->where('type', ImportBatch::TYPE_NEWSLETTER_SUBSCRIBERS)
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
        abort_unless($importBatch->type === ImportBatch::TYPE_NEWSLETTER_SUBSCRIBERS, 404);

        return response()->json(['success' => true, 'data' => $importBatch->load('importer:id,name,email')]);
    }

    public function importErrors(ImportBatch $importBatch): StreamedResponse|JsonResponse
    {
        abort_unless($importBatch->type === ImportBatch::TYPE_NEWSLETTER_SUBSCRIBERS, 404);

        if (! $importBatch->error_file_path || ! Storage::disk('local')->exists($importBatch->error_file_path)) {
            return response()->json(['message' => 'No error file is available for this import.'], 404);
        }

        return Storage::disk('local')->download($importBatch->error_file_path, "newsletter-import-errors-{$importBatch->id}.csv", [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function importTemplate(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'wb');
            fputcsv($output, self::IMPORT_HEADERS);
            fputcsv($output, ['2026-01-01 12:00', 'sample@example.com', 'Job Seeker', 'Checked']);
            fclose($output);
        }, 'newsletter-import-template.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function applyStatus(NewsletterSubscriber $subscriber, string $status): void
    {
        $subscriber->forceFill([
            'status' => $status,
            'subscribed_at' => $status === NewsletterSubscriber::STATUS_ACTIVE
                ? ($subscriber->subscribed_at ?? now())
                : $subscriber->subscribed_at,
            'unsubscribed_at' => $status === NewsletterSubscriber::STATUS_UNSUBSCRIBED
                ? ($subscriber->unsubscribed_at ?? now())
                : ($status === NewsletterSubscriber::STATUS_ACTIVE ? null : $subscriber->unsubscribed_at),
        ])->save();
    }

    private function filteredQuery(Request $request): Builder
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        return NewsletterSubscriber::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('email', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('subscriber_type', 'like', "%{$search}%")
                        ->orWhere('source', 'like', "%{$search}%");
                });
            })
            ->when(in_array($status, [
                NewsletterSubscriber::STATUS_ACTIVE,
                NewsletterSubscriber::STATUS_UNSUBSCRIBED,
                NewsletterSubscriber::STATUS_BLOCKED,
            ], true), fn ($query) => $query->where('status', $status))
            ->when($request->query('subscriber_type'), fn ($query, $type) => $query->where('subscriber_type', $type))
            ->when($request->query('source'), fn ($query, $source) => $query->where('source', $source))
            ->when($request->has('consent'), fn ($query) => $query->where('consent', $request->boolean('consent')))
            ->when($request->boolean('imported_only'), fn ($query) => $query->whereNotNull('imported_at'))
            ->when($request->query('import_batch_id'), fn ($query, $batchId) => $query->where('import_batch_id', $batchId))
            ->when($request->query('date_from'), fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($request->query('date_to'), fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->latestSubscribers();
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
        $submittedAt = $this->parseCsvDate($row['Submission date'] ?? null);
        $consent = $this->normalizeConsent($row['Yes, subscribe me to your newsletter.'] ?? null);

        return [
            'original_submitted_at' => $submittedAt,
            'email' => $this->cleanEmail($row['Email'] ?? null),
            'subscriber_type' => $this->normalizeSubscriberType($row['Are you a job seeker or an employer?'] ?? null),
            'consent' => $consent,
            'consent_at' => $consent ? $submittedAt : null,
            'status' => $consent ? NewsletterSubscriber::STATUS_ACTIVE : NewsletterSubscriber::STATUS_UNSUBSCRIBED,
        ];
    }

    private function importRowRules(): array
    {
        return [
            'original_submitted_at' => ['nullable', 'date'],
            'email' => ['required', 'email', 'max:255'],
            'subscriber_type' => ['nullable', 'string', 'max:100'],
            'consent' => ['boolean'],
            'consent_at' => ['nullable', 'date'],
            'status' => ['required', 'string'],
        ];
    }

    private function handleExistingSubscriber(NewsletterSubscriber $subscriber, array $row, string $mode, ImportBatch $batch, Request $request): bool
    {
        if ($mode === 'reactivate_consented' && $row['consent'] && $subscriber->status === NewsletterSubscriber::STATUS_UNSUBSCRIBED) {
            $subscriber->forceFill([
                'status' => NewsletterSubscriber::STATUS_ACTIVE,
                'consent' => true,
                'consent_at' => $subscriber->consent_at ?? $row['consent_at'] ?? now(),
                'subscribed_at' => $subscriber->subscribed_at ?? now(),
                'unsubscribed_at' => null,
            ])->save();
            return true;
        }

        if ($mode === 'update_empty_fields') {
            $updates = [];
            foreach (['subscriber_type', 'source', 'original_submitted_at', 'consent_at'] as $field) {
                if (blank($subscriber->{$field}) && filled($row[$field] ?? null)) {
                    $updates[$field] = $row[$field];
                }
            }
            if ($updates) {
                $updates['import_batch_id'] = $subscriber->import_batch_id ?? $batch->id;
                $updates['imported_at'] = $subscriber->imported_at ?? now();
                $updates['imported_by'] = $subscriber->imported_by ?? $request->user()?->id;
                $updates['import_source_file'] = $subscriber->import_source_file ?? $batch->original_filename;
                $subscriber->forceFill($updates)->save();
                return true;
            }
        }

        return false;
    }

    private function subscriberPayloadFromImport(array $row, ImportBatch $batch, Request $request): array
    {
        $now = now();

        return [
            'email' => $row['email'],
            'name' => null,
            'role' => $this->roleFromSubscriberType($row['subscriber_type']),
            'subscriber_type' => $row['subscriber_type'],
            'consent' => $row['consent'],
            'consent_at' => $row['consent_at'],
            'status' => $row['status'],
            'source' => 'legacy_import',
            'original_submitted_at' => $row['original_submitted_at'],
            'unsubscribe_token' => \Illuminate\Support\Str::random(64),
            'subscribed_at' => $row['status'] === NewsletterSubscriber::STATUS_ACTIVE ? ($row['original_submitted_at'] ?? $now) : null,
            'unsubscribed_at' => $row['status'] === NewsletterSubscriber::STATUS_UNSUBSCRIBED ? $now : null,
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

    private function normalizeConsent(mixed $value): bool
    {
        $normalized = strtolower((string) $this->clean($value));
        return in_array($normalized, ['checked', 'yes', 'true', '1', 'subscribed'], true);
    }

    private function normalizeSubscriberType(mixed $value): ?string
    {
        $raw = $this->clean($value);
        if (! $raw) {
            return null;
        }

        $normalized = strtolower(str_replace(['-', '_'], ' ', $raw));
        return match (true) {
            str_contains($normalized, 'seeker') => 'job_seeker',
            str_contains($normalized, 'employer') => 'employer',
            str_contains($normalized, 'other') => 'other',
            default => $raw,
        };
    }

    private function subscriberTypeFromRole(?string $role): ?string
    {
        return match ($role) {
            'seeker' => 'job_seeker',
            'employer' => 'employer',
            default => null,
        };
    }

    private function roleFromSubscriberType(?string $type): ?string
    {
        return match ($type) {
            'job_seeker' => 'seeker',
            'employer' => 'employer',
            default => null,
        };
    }

    private function subscriberTypeForExport(?string $type): string
    {
        return match ($type) {
            'job_seeker', 'seeker' => 'Job Seeker',
            'employer' => 'Employer',
            default => (string) $type,
        };
    }

    private function isEmptyCsvRow(array $row): bool
    {
        return collect($row)->every(fn ($value) => trim((string) $value) === '');
    }

    private function errorRow(int $rowNumber, array $row, array $errors): array
    {
        return ['Row' => $rowNumber, 'Errors' => implode('; ', $errors), ...$row];
    }

    private function writeErrorCsv(ImportBatch $batch, array $errors): string
    {
        $path = "newsletter-import-errors/newsletter-import-errors-{$batch->id}.csv";
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

    private function importResult(ImportBatch $batch, array $stats): array
    {
        return [
            'batch_id' => $batch->id,
            'total_rows' => $batch->total_rows,
            'imported_rows' => $batch->imported_rows,
            'duplicate_rows' => $batch->duplicate_rows,
            'skipped_rows' => $batch->skipped_rows,
            'failed_rows' => $batch->failed_rows,
            'active_rows' => $batch->active_rows,
            'non_consented_rows' => $batch->non_consented_rows,
            'error_file_url' => $batch->error_file_path ? url("/api/admin/newsletter-imports/{$batch->id}/errors") : null,
        ];
    }

    private function csvCell(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        return preg_match('/^[=+\-@]/', $value) ? "'{$value}" : $value;
    }
}
