<?php

namespace App\Http\Controllers;

use App\Models\CareerGrowthRegistration;
use App\Models\ContactSubmission;
use App\Models\JobApplication;
use App\Models\NewsletterSubscriber;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminFormsController extends Controller
{
    private const FORM_KEYS = [
        'all',
        'career_growth_course_application',
        'job_seeker_contact',
        'employer_contact',
        'subscribe',
        'general_labour_application',
        'az_driver_application',
        'forklift_application',
        'unclassified_contact',
        'unclassified_job_application',
    ];

    public function summary(): JsonResponse
    {
        $forms = [
            $this->modelSummary(
                'career_growth_course_application',
                'Career Growth Course Application',
                DB::table('career_growth_registrations')->whereNull('deleted_at'),
                'new'
            ),
            $this->modelSummary(
                'job_seeker_contact',
                'Job Seeker Contact Us Form',
                $this->contactQuery('job_seeker_contact'),
                'unread'
            ),
            $this->modelSummary(
                'employer_contact',
                'Employer Contact Form',
                $this->contactQuery('employer_contact'),
                'unread'
            ),
            $this->modelSummary(
                'subscribe',
                'Subscribe Form',
                DB::table('newsletter_subscribers')->whereNull('deleted_at'),
                null
            ),
            $this->modelSummary(
                'general_labour_application',
                'General Labour Application',
                DB::table('job_applications')->whereNull('deleted_at')->where('application_form_key', 'general_labour_application'),
                'new'
            ),
            $this->modelSummary(
                'az_driver_application',
                'AZ Driver Application',
                DB::table('job_applications')->whereNull('deleted_at')->where('application_form_key', 'az_driver_application'),
                'new'
            ),
            $this->modelSummary(
                'forklift_application',
                'Forklift Application',
                DB::table('job_applications')->whereNull('deleted_at')->where('application_form_key', 'forklift_application'),
                'new'
            ),
        ];

        $unclassifiedContacts = $this->contactQuery('unclassified_contact');
        if ((clone $unclassifiedContacts)->exists()) {
            $forms[] = $this->modelSummary('unclassified_contact', 'Unclassified Contact Entries', $unclassifiedContacts, 'unread');
        }

        $unclassifiedJobs = DB::table('job_applications')->whereNull('deleted_at')->whereNull('application_form_key');
        if ((clone $unclassifiedJobs)->exists()) {
            $forms[] = $this->modelSummary('unclassified_job_application', 'Unclassified Job Applications', $unclassifiedJobs, 'new');
        }

        return response()->json(['success' => true, 'data' => $forms]);
    }

    public function submissions(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'form' => ['nullable', 'in:'.implode(',', self::FORM_KEYS)],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort' => ['nullable', 'in:latest'],
            'trashed' => ['nullable', 'in:false,only'],
        ]);

        $combined = $this->combinedQuery($validated);

        $paginator = DB::query()
            ->fromSub($combined, 'form_submissions')
            ->orderByDesc('submitted_at')
            ->paginate((int) ($validated['per_page'] ?? 100));

        return response()->json([
            'success' => true,
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(string $type, int $id): JsonResponse
    {
        $record = match ($type) {
            'contact' => ContactSubmission::withTrashed()->findOrFail($id),
            'newsletter' => NewsletterSubscriber::withTrashed()->findOrFail($id),
            'career_growth' => CareerGrowthRegistration::withTrashed()->findOrFail($id),
            'job_application' => JobApplication::withTrashed()->findOrFail($id),
            default => abort(404),
        };

        return response()->json([
            'success' => true,
            'data' => [
                'record_type' => $type,
                'record' => $record,
            ],
        ]);
    }

    public function bulkAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'in:trash,restore,force_delete,mark_seen,archive'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.form_key' => ['required', 'string', 'in:'.implode(',', array_diff(self::FORM_KEYS, ['all']))],
            'items.*.record_id' => ['required', 'integer', 'min:1'],
        ]);

        $action = $validated['action'];
        if ($action === 'force_delete' && ! $this->canForceDelete($request)) {
            abort(403, 'Only an administrator can permanently delete submissions.');
        }

        $results = [];
        DB::transaction(function () use ($validated, $action, $request, &$results): void {
            foreach ($validated['items'] as $item) {
                $modelClass = $this->modelClassForForm($item['form_key']);
                $query = in_array($action, ['restore', 'force_delete'], true)
                    ? $modelClass::onlyTrashed()
                    : $modelClass::query();
                $record = $query->findOrFail($item['record_id']);

                if (in_array($action, ['mark_seen', 'archive'], true) && ! $record instanceof ContactSubmission) {
                    abort(422, 'Mark seen and archive are available only for contact submissions.');
                }

                match ($action) {
                    'trash' => $this->trashRecord($record, $request->user()?->id),
                    'restore' => $this->restoreRecord($record, $request->user()?->id),
                    'force_delete' => $record->forceDelete(),
                    'mark_seen' => $record->forceFill(['status' => 'read', 'read_at' => now()])->save(),
                    'archive' => $record->forceFill(['status' => 'archived'])->save(),
                };
                $results[] = ['form_key' => $item['form_key'], 'record_id' => $item['record_id'], 'success' => true];
            }
        });

        return response()->json(['success' => true, 'data' => $results]);
    }

    public function export(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'form' => ['nullable', 'in:'.implode(',', self::FORM_KEYS)],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'trashed' => ['nullable', 'in:false,only'],
        ]);

        $rows = DB::query()->fromSub($this->combinedQuery($validated), 'form_submissions')
            ->orderByDesc('submitted_at')->cursor();

        return $this->csvResponse($rows, 'form-submissions-'.now()->format('Y-m-d-His').'.csv');
    }

    public function exportSelected(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.form_key' => ['required', 'string', 'in:'.implode(',', array_diff(self::FORM_KEYS, ['all']))],
            'items.*.record_id' => ['required', 'integer', 'min:1'],
        ]);
        $wanted = collect($validated['items'])->mapWithKeys(
            fn (array $item) => [$item['form_key'].'-'.$item['record_id'] => true]
        );
        $rows = collect();
        foreach (['false', 'only'] as $trashed) {
            $cursor = DB::query()->fromSub($this->combinedQuery(['form' => 'all', 'trashed' => $trashed]), 'form_submissions')->cursor();
            foreach ($cursor as $row) {
                if ($wanted->has($row->form_key.'-'.$row->record_id)) {
                    $rows->push($row);
                }
            }
        }

        return $this->csvResponse($rows, 'selected-form-submissions-'.now()->format('Y-m-d-His').'.csv');
    }

    private function combinedQuery(array $filters): Builder
    {
        $form = $filters['form'] ?? 'all';
        $queries = [];
        if (in_array($form, ['all', 'job_seeker_contact', 'employer_contact', 'unclassified_contact'], true)) {
            $queries[] = $this->contactSubmissionsQuery($form, $filters);
        }
        if (in_array($form, ['all', 'subscribe'], true)) {
            $queries[] = $this->newsletterSubmissionsQuery($filters);
        }
        if (in_array($form, ['all', 'career_growth_course_application'], true)) {
            $queries[] = $this->careerGrowthSubmissionsQuery($filters);
        }
        if (in_array($form, ['all', 'general_labour_application', 'az_driver_application', 'forklift_application', 'unclassified_job_application'], true)) {
            $queries[] = $this->jobSubmissionsQuery($form, $filters);
        }
        $combined = array_shift($queries);
        foreach ($queries as $query) {
            $combined->unionAll($query);
        }

        return $combined;
    }

    private function modelClassForForm(string $formKey): string
    {
        return match ($formKey) {
            'job_seeker_contact', 'employer_contact', 'unclassified_contact' => ContactSubmission::class,
            'subscribe' => NewsletterSubscriber::class,
            'career_growth_course_application' => CareerGrowthRegistration::class,
            'general_labour_application', 'az_driver_application', 'forklift_application', 'unclassified_job_application' => JobApplication::class,
            default => abort(422, 'Unsupported form type.'),
        };
    }

    private function trashRecord(object $record, ?int $userId): void
    {
        $record->forceFill(['deleted_by' => $userId, 'restored_by' => null])->save();
        $record->delete();
    }

    private function restoreRecord(object $record, ?int $userId): void
    {
        $record->forceFill(['restored_by' => $userId])->save();
        $record->restore();
    }

    private function canForceDelete(Request $request): bool
    {
        $user = $request->user();
        return (bool) ($user?->is_global_admin || ($user && method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['super_admin', 'admin'])));
    }

    private function csvResponse(iterable $rows, string $filename): StreamedResponse
    {
        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Form Name', 'Submission ID', 'Submitter', 'Email', 'Phone', 'Status', 'Submitted At', 'Source', 'Summary', 'Job Title', 'Course']);
            foreach ($rows as $row) {
                fputcsv($handle, array_map(
                    fn ($value) => $this->safeCsvValue($value),
                    [
                        $row->form_name, $row->record_id, $row->name, $row->email, $row->phone,
                        $row->status, $row->submitted_at, $row->source,
                        $row->message_preview ?: $row->subject, $row->job_title, $row->course,
                    ]
                ));
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function safeCsvValue(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }
        return preg_match('/^[\s]*[=+\-@]/', $value) ? "'".$value : $value;
    }

    private function modelSummary(string $key, string $name, Builder $query, ?string $newStatus): array
    {
        return [
            'key' => $key,
            'name' => $name,
            'type' => 'Website',
            'submissions_count' => (clone $query)->count(),
            'new_submissions_count' => $newStatus ? (clone $query)->where('status', $newStatus)->count() : 0,
            'status' => 'active',
            'last_updated_at' => (clone $query)->max('updated_at'),
            'created_at' => (clone $query)->min('created_at'),
        ];
    }

    private function contactQuery(string $form, bool $trashed = false): Builder
    {
        $query = DB::table('contact_submissions')
            ->when($trashed, fn (Builder $query) => $query->whereNotNull('deleted_at'))
            ->when(! $trashed, fn (Builder $query) => $query->whereNull('deleted_at'))
            ->where(fn (Builder $query) => $query
                ->whereNull('source')
                ->orWhere(function (Builder $query): void {
                    $query->where('source', 'not like', 'Apply Form - %')
                        ->where('source', 'not like', 'Career Growth - %');
                }));

        return match ($form) {
            'job_seeker_contact' => $query->where(fn (Builder $query) => $query->where('form_key', 'job_seeker_contact')->orWhere(fn (Builder $query) => $query->whereNull('form_key')->where('role', 'seeker'))),
            'employer_contact' => $query->where(fn (Builder $query) => $query->where('form_key', 'employer_contact')->orWhere(fn (Builder $query) => $query->whereNull('form_key')->where('role', 'employer'))),
            'unclassified_contact' => $query->whereNull('form_key')->whereNull('role'),
            default => $query,
        };
    }

    private function contactSubmissionsQuery(string $form, array $filters): Builder
    {
        $query = $this->contactQuery($form, ($filters['trashed'] ?? 'false') === 'only')->selectRaw("
            CONCAT('contact-', id) AS id, id AS record_id, 'contact' AS record_type,
            CASE WHEN form_key IS NOT NULL THEN form_key WHEN role = 'seeker' THEN 'job_seeker_contact' WHEN role = 'employer' THEN 'employer_contact' ELSE 'unclassified_contact' END AS form_key,
            CASE WHEN form_name IS NOT NULL THEN form_name WHEN role = 'seeker' THEN 'Job Seeker Contact Us Form' WHEN role = 'employer' THEN 'Employer Contact Form' ELSE 'Unclassified Contact Entries' END AS form_name,
            name, email, phone, location, subject, LEFT(message, 180) AS message_preview,
            role AS subscriber_type, NULL AS consent, status, COALESCE(source, 'Website') AS source,
            COALESCE(original_created_at, created_at) AS submitted_at,
            NULL AS job_title, NULL AS job_slug, NULL AS job_id, NULL AS availability,
            NULL AS current_status, NULL AS course, deleted_at, deleted_by
        ");
        $this->filters($query, $filters, ['name', 'email', 'phone', 'location', 'subject', 'message', 'source']);

        return $query;
    }

    private function newsletterSubmissionsQuery(array $filters): Builder
    {
        $query = DB::table('newsletter_subscribers')
            ->when(($filters['trashed'] ?? 'false') === 'only', fn (Builder $query) => $query->whereNotNull('deleted_at'))
            ->when(($filters['trashed'] ?? 'false') !== 'only', fn (Builder $query) => $query->whereNull('deleted_at'))
            ->selectRaw("
            CONCAT('newsletter-', id) AS id, id AS record_id, 'newsletter' AS record_type,
            'subscribe' AS form_key, 'Subscribe Form' AS form_name,
            name, email, NULL AS phone, NULL AS location, NULL AS subject, NULL AS message_preview,
            COALESCE(subscriber_type, role) AS subscriber_type, consent, status, COALESCE(source, 'Website') AS source,
            COALESCE(original_submitted_at, subscribed_at, created_at) AS submitted_at,
            NULL AS job_title, NULL AS job_slug, NULL AS job_id, NULL AS availability,
            NULL AS current_status, NULL AS course, deleted_at, deleted_by
        ");
        $this->filters($query, $filters, ['name', 'email', 'subscriber_type', 'source']);

        return $query;
    }

    private function careerGrowthSubmissionsQuery(array $filters): Builder
    {
        $query = DB::table('career_growth_registrations')
            ->when(($filters['trashed'] ?? 'false') === 'only', fn (Builder $query) => $query->whereNotNull('deleted_at'))
            ->when(($filters['trashed'] ?? 'false') !== 'only', fn (Builder $query) => $query->whereNull('deleted_at'))
            ->selectRaw("
            CONCAT('career-', id) AS id, id AS record_id, 'career_growth' AS record_type,
            'career_growth_course_application' AS form_key, 'Career Growth Course Application' AS form_name,
            CONCAT(first_name, ' ', last_name) AS name, email, phone, NULL AS location,
            course AS subject, NULL AS message_preview, current_status AS subscriber_type,
            NULL AS consent, status, 'Career Growth Course' AS source, created_at AS submitted_at,
            NULL AS job_title, NULL AS job_slug, NULL AS job_id, NULL AS availability,
            current_status, course, deleted_at, deleted_by
        ");
        $this->filters($query, $filters, ['first_name', 'last_name', 'email', 'phone', 'current_status', 'course']);

        return $query;
    }

    private function jobSubmissionsQuery(string $form, array $filters): Builder
    {
        $query = DB::table('job_applications')
            ->when(($filters['trashed'] ?? 'false') === 'only', fn (Builder $query) => $query->whereNotNull('deleted_at'))
            ->when(($filters['trashed'] ?? 'false') !== 'only', fn (Builder $query) => $query->whereNull('deleted_at'))
            ->when($form === 'unclassified_job_application', fn (Builder $query) => $query->whereNull('application_form_key'))
            ->when(! in_array($form, ['all', 'unclassified_job_application'], true), fn (Builder $query) => $query->where('application_form_key', $form))
            ->selectRaw("
                CONCAT('job-', id) AS id, id AS record_id, 'job_application' AS record_type,
                COALESCE(application_form_key, 'unclassified_job_application') AS form_key,
                COALESCE(application_form_name, 'Unclassified Job Applications') AS form_name,
                CONCAT(first_name, ' ', last_name) AS name, email, phone, city AS location,
                job_title AS subject, LEFT(message, 180) AS message_preview, NULL AS subscriber_type,
                NULL AS consent, status, COALESCE(source, 'Website') AS source, created_at AS submitted_at,
                job_title, job_slug, job_id, availability, NULL AS current_status, NULL AS course,
                deleted_at, deleted_by
            ");
        $this->filters($query, $filters, ['first_name', 'last_name', 'email', 'phone', 'city', 'job_title', 'job_slug', 'message', 'source']);

        return $query;
    }

    private function filters(Builder $query, array $filters, array $columns): void
    {
        $search = trim($filters['search'] ?? '');
        if ($search !== '') {
            $query->where(function (Builder $query) use ($columns, $search): void {
                foreach ($columns as $index => $column) {
                    $query->{$index === 0 ? 'where' : 'orWhere'}($column, 'like', "%{$search}%");
                }
            });
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }
    }
}
