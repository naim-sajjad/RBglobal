<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use App\Models\TimesheetDocument;
use App\Models\TimesheetDocumentReview;
use App\Services\Financial\TimesheetDocumentReviewService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TimesheetDocumentReviewController extends Controller
{
    protected function assertStaffTimesheet(Timesheet $timesheet): void
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if (! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'Unauthorized');
        }
    }

    /**
     * Admin: list driver adjustment requests (optionally filter by handling status).
     */
    public function listAdjustmentRequests(Request $request)
    {
        if (! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'adjustment_status' => 'nullable|in:open,in_progress,resolved,dismissed,all_open,all',
            'driver_id' => 'nullable|integer',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = TimesheetDocumentReview::query()
            ->where('status', TimesheetDocumentReview::STATUS_ADJUSTMENT_REQUESTED)
            ->with([
                'timesheet.employer',
                'driver.user',
                'sender:id,name',
                'resolver:id,name',
            ])
            ->orderByDesc('reviewed_at')
            ->orderByDesc('id');

        if (tenant('id')) {
            $query->where('tenant_id', tenant('id'));
        }

        $filter = $validated['adjustment_status'] ?? 'all_open';
        if ($filter === 'all_open') {
            $query->where(function ($q) {
                $q->whereIn('adjustment_status', [
                    TimesheetDocumentReview::ADJUSTMENT_OPEN,
                    TimesheetDocumentReview::ADJUSTMENT_IN_PROGRESS,
                ])->orWhereNull('adjustment_status');
            });
        } elseif ($filter !== 'all') {
            $query->where('adjustment_status', $filter);
        }

        if (! empty($validated['driver_id'])) {
            $query->where('driver_id', $validated['driver_id']);
        }

        $perPage = $validated['per_page'] ?? 50;

        return response()->json($query->paginate($perPage));
    }

    /**
     * Admin: update adjustment handling status + notes.
     */
    public function updateAdjustment(Request $request, TimesheetDocumentReview $review)
    {
        if (! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'Unauthorized');
        }
        if ($review->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'adjustment_status' => 'required|in:open,in_progress,resolved,dismissed',
            'admin_notes' => 'nullable|string|max:5000',
        ]);

        try {
            $review = TimesheetDocumentReviewService::updateAdjustmentHandling(
                $review,
                $validated['adjustment_status'],
                $validated['admin_notes'] ?? null,
                auth()->id()
            );
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Adjustment request updated.',
            'review' => $review,
        ]);
    }

    /**
     * Admin: list review cycles for a timesheet.
     */
    public function index(Timesheet $timesheet)
    {
        $this->assertStaffTimesheet($timesheet);

        $reviews = $timesheet->documentReviews()
            ->with([
                'invoiceDocument',
                'calculationDocument',
                'sender:id,name',
                'events',
            ])
            ->orderByDesc('id')
            ->get();

        return response()->json($reviews);
    }

    /**
     * Admin: send latest invoice + calculation sheet to the driver for review.
     */
    public function send(Timesheet $timesheet)
    {
        $this->assertStaffTimesheet($timesheet);

        try {
            $review = TimesheetDocumentReviewService::sendForReview($timesheet, auth()->id());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $review->makeHidden(['token']);

        return response()->json([
            'message' => 'Review package emailed to the driver.',
            'review' => $review,
        ], 201);
    }

    /**
     * Public: load review package by token (no auth).
     */
    public function showByToken(string $token)
    {
        $review = TimesheetDocumentReviewService::findByToken($token);
        if (! $review) {
            return response()->json(['message' => 'Invalid or expired review link.'], 404);
        }

        $outdated = false;
        $canRespond = false;
        $message = null;

        try {
            if ($review->status === TimesheetDocumentReview::STATUS_PENDING) {
                TimesheetDocumentReviewService::assertCanRespond($review->fresh());
                $canRespond = true;
            }
        } catch (RuntimeException $e) {
            $outdated = true;
            $message = $e->getMessage();
            $review = $review->fresh([
                'timesheet.employer',
                'invoiceDocument',
                'calculationDocument',
                'driver.user',
            ]);
        }

        $timesheet = $review->timesheet;
        $contacts = \App\Services\Financial\EmailTemplateService::legacyContactEmails(
            $review->tenant_id ?? $timesheet?->tenant_id
        );

        return response()->json([
            'status' => $review->status,
            'status_label' => $review->statusLabel(),
            'can_respond' => $canRespond,
            'outdated' => $outdated,
            'message' => $message,
            'reviewed_at' => $review->reviewed_at,
            'adjustment_comment' => $review->adjustment_comment,
            'driver_name' => $review->driver_name,
            'period_start' => $timesheet?->week_start_date?->format('Y-m-d'),
            'period_end' => $timesheet?->week_end_date?->format('Y-m-d'),
            'employer_name' => $timesheet?->employer?->name,
            'weekly_total' => $timesheet?->weekly_total,
            'legacy_emails' => [
                'adjustments' => $contacts['adjustments_email'],
                'clearance' => $contacts['clearance_email'],
            ],
            'documents' => [
                'invoice' => [
                    'id' => $review->invoice_document_id,
                    'filename' => $review->invoiceDocument?->original_filename,
                    'view_url' => TimesheetDocumentReviewService::apiDocumentUrl(
                        $token,
                        TimesheetDocument::TYPE_INVOICE
                    ),
                ],
                'calculation_sheet' => [
                    'id' => $review->calculation_document_id,
                    'filename' => $review->calculationDocument?->original_filename,
                    'view_url' => TimesheetDocumentReviewService::apiDocumentUrl(
                        $token,
                        TimesheetDocument::TYPE_CALCULATION_SHEET
                    ),
                ],
            ],
            'token_expires_at' => $review->token_expires_at,
        ]);
    }

    /**
     * Public: approve current package.
     */
    public function approveByToken(string $token)
    {
        $review = TimesheetDocumentReviewService::findByToken($token);
        if (! $review) {
            return response()->json(['message' => 'Invalid or expired review link.'], 404);
        }

        try {
            $review = TimesheetDocumentReviewService::approve($review);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Thank you. Your review has been recorded.',
            'status' => $review->status,
            'reviewed_at' => $review->reviewed_at,
        ]);
    }

    /**
     * Public: request adjustment with comments.
     */
    public function requestAdjustmentByToken(Request $request, string $token)
    {
        $review = TimesheetDocumentReviewService::findByToken($token);
        if (! $review) {
            return response()->json(['message' => 'Invalid or expired review link.'], 404);
        }

        $validated = $request->validate([
            'comment' => 'required|string|min:3|max:5000',
        ]);

        try {
            $review = TimesheetDocumentReviewService::requestAdjustment($review, $validated['comment']);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Adjustment request submitted. Admin will update the documents and send them again.',
            'status' => $review->status,
            'reviewed_at' => $review->reviewed_at,
            'adjustment_comment' => $review->adjustment_comment,
        ]);
    }

    /**
     * Public: stream pinned PDF for this review token.
     */
    public function viewDocumentByToken(string $token, string $type): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        if (! in_array($type, [TimesheetDocument::TYPE_INVOICE, TimesheetDocument::TYPE_CALCULATION_SHEET], true)) {
            return response()->json(['message' => 'Invalid document type.'], 404);
        }

        $review = TimesheetDocumentReviewService::findByToken($token);
        if (! $review) {
            return response()->json(['message' => 'Invalid or expired review link.'], 404);
        }

        // Allow viewing even if already responded, but not if superseded/expired without valid docs
        if (in_array($review->status, [
            TimesheetDocumentReview::STATUS_SUPERSEDED,
            TimesheetDocumentReview::STATUS_EXPIRED,
        ], true)) {
            return response()->json([
                'message' => 'This review link is no longer valid for viewing documents.',
            ], 422);
        }

        try {
            $document = TimesheetDocumentReviewService::documentForType($review, $type);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        }

        if (! $document || ! $document->file_path || ! Storage::disk('public')->exists($document->file_path)) {
            return response()->json(['message' => 'Document file not found.'], 404);
        }

        TimesheetDocumentReviewService::recordDocumentViewed($review, $type);

        return Storage::disk('public')->response(
            $document->file_path,
            $document->original_filename,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$document->original_filename.'"',
            ]
        );
    }
}
