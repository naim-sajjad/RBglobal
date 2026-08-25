<?php

namespace App\Services\Financial;

use App\Mail\TimesheetDocumentReviewMail;
use App\Models\DriverNotification;
use App\Models\Timesheet;
use App\Models\TimesheetDocument;
use App\Models\TimesheetDocumentReview;
use App\Models\TimesheetDocumentReviewEvent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class TimesheetDocumentReviewService
{
    public static function latestDocument(Timesheet $timesheet, string $documentType): ?TimesheetDocument
    {
        return TimesheetDocument::query()
            ->where('timesheet_id', $timesheet->id)
            ->where('document_type', $documentType)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @return array{invoice: TimesheetDocument, calculation: TimesheetDocument}
     */
    public static function requireLatestPair(Timesheet $timesheet): array
    {
        $invoice = self::latestDocument($timesheet, TimesheetDocument::TYPE_INVOICE);
        $calculation = self::latestDocument($timesheet, TimesheetDocument::TYPE_CALCULATION_SHEET);

        if (! $invoice || ! $calculation) {
            throw new RuntimeException(
                'Both an Invoice and a Calculation Sheet must exist before sending for review.'
            );
        }

        return ['invoice' => $invoice, 'calculation' => $calculation];
    }

    public static function supersedePendingForTimesheet(
        Timesheet $timesheet,
        string $reason,
        string $actorType = 'system',
        ?int $actorId = null
    ): int {
        $pending = TimesheetDocumentReview::query()
            ->where('timesheet_id', $timesheet->id)
            ->where('status', TimesheetDocumentReview::STATUS_PENDING)
            ->get();

        foreach ($pending as $review) {
            $review->update(['status' => TimesheetDocumentReview::STATUS_SUPERSEDED]);
            self::recordEvent($review, TimesheetDocumentReviewEvent::SUPERSEDED, $actorType, $actorId, [
                'reason' => $reason,
            ]);
        }

        return $pending->count();
    }

    /**
     * Create a new review cycle, email the driver, and supersede prior pending reviews.
     */
    public static function sendForReview(Timesheet $timesheet, ?int $adminUserId = null): TimesheetDocumentReview
    {
        $timesheet->loadMissing(['driver.user', 'employer']);
        $driver = $timesheet->driver;
        if (! $driver) {
            throw new RuntimeException('Timesheet has no driver.');
        }

        $email = $driver->user?->email;
        if (! is_string($email) || $email === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Driver does not have a valid email address.');
        }

        $pair = self::requireLatestPair($timesheet);
        self::supersedePendingForTimesheet(
            $timesheet,
            'New review package sent',
            'admin',
            $adminUserId
        );

        $token = Str::random(64);
        $review = TimesheetDocumentReview::create([
            'tenant_id' => $timesheet->tenant_id,
            'timesheet_id' => $timesheet->id,
            'invoice_document_id' => $pair['invoice']->id,
            'calculation_document_id' => $pair['calculation']->id,
            'driver_id' => $driver->id,
            'token' => $token,
            'status' => TimesheetDocumentReview::STATUS_PENDING,
            'token_expires_at' => now()->addDays(14),
            'sent_at' => now(),
            'sent_by' => $adminUserId,
            'driver_name' => $driver->user?->name,
            'driver_email' => $email,
        ]);

        self::recordEvent($review, TimesheetDocumentReviewEvent::SENT, 'admin', $adminUserId, [
            'invoice_document_id' => $pair['invoice']->id,
            'calculation_document_id' => $pair['calculation']->id,
            'driver_email' => $email,
        ]);

        DriverNotification::create([
            'tenant_id' => $timesheet->tenant_id,
            'driver_id' => $driver->id,
            'type' => 'timesheet_document_review',
            'title' => 'Timesheet documents ready for review',
            'message' => 'Your calculation sheet and invoice are ready. Please review and confirm or request an adjustment.',
            'meta' => [
                'timesheet_id' => $timesheet->id,
                'review_id' => $review->id,
            ],
            'created_by_user_id' => $adminUserId,
        ]);

        self::sendEmail($review, $timesheet, $pair['invoice'], $pair['calculation'], $token);

        return $review->load([
            'invoiceDocument',
            'calculationDocument',
            'sender:id,name',
            'events',
        ]);
    }

    public static function findByToken(string $token): ?TimesheetDocumentReview
    {
        if ($token === '') {
            return null;
        }

        return TimesheetDocumentReview::query()
            ->where('token', $token)
            ->with([
                'timesheet.employer',
                'invoiceDocument',
                'calculationDocument',
                'driver.user',
            ])
            ->first();
    }

    /**
     * Ensure the review is still pending, not expired, and pinned to the current documents.
     */
    public static function assertCanRespond(TimesheetDocumentReview $review): void
    {
        if ($review->status === TimesheetDocumentReview::STATUS_SUPERSEDED) {
            throw new RuntimeException(
                'This review link is outdated. Updated documents were sent — please use the latest email.'
            );
        }
        if ($review->status === TimesheetDocumentReview::STATUS_APPROVED) {
            throw new RuntimeException('You have already approved these documents.');
        }
        if ($review->status === TimesheetDocumentReview::STATUS_ADJUSTMENT_REQUESTED) {
            throw new RuntimeException('An adjustment request was already submitted for this package.');
        }
        if ($review->status !== TimesheetDocumentReview::STATUS_PENDING) {
            throw new RuntimeException('This review link is no longer active.');
        }
        if ($review->token_expires_at && $review->token_expires_at->isPast()) {
            $review->update(['status' => TimesheetDocumentReview::STATUS_EXPIRED]);
            throw new RuntimeException('This review link has expired. Please ask admin to resend.');
        }

        $timesheet = $review->timesheet;
        $latestInvoice = self::latestDocument($timesheet, TimesheetDocument::TYPE_INVOICE);
        $latestCalc = self::latestDocument($timesheet, TimesheetDocument::TYPE_CALCULATION_SHEET);

        if (
            ! $latestInvoice
            || ! $latestCalc
            || (int) $latestInvoice->id !== (int) $review->invoice_document_id
            || (int) $latestCalc->id !== (int) $review->calculation_document_id
        ) {
            $review->update(['status' => TimesheetDocumentReview::STATUS_SUPERSEDED]);
            self::recordEvent($review, TimesheetDocumentReviewEvent::SUPERSEDED, 'system', null, [
                'reason' => 'Documents changed after send',
            ]);
            throw new RuntimeException(
                'These documents are outdated. Please wait for a new review email with the updated package.'
            );
        }
    }

    public static function approve(TimesheetDocumentReview $review): TimesheetDocumentReview
    {
        self::assertCanRespond($review);

        $review->update([
            'status' => TimesheetDocumentReview::STATUS_APPROVED,
            'reviewed_at' => now(),
        ]);

        self::recordEvent($review, TimesheetDocumentReviewEvent::APPROVED, 'driver', $review->driver_id, [
            'driver_name' => $review->driver_name,
            'driver_email' => $review->driver_email,
        ]);

        return $review->fresh([
            'invoiceDocument',
            'calculationDocument',
            'events',
        ]);
    }

    public static function requestAdjustment(
        TimesheetDocumentReview $review,
        string $comment
    ): TimesheetDocumentReview {
        self::assertCanRespond($review);

        $comment = trim($comment);
        if ($comment === '') {
            throw new RuntimeException('Please describe what needs to be corrected.');
        }

        $review->update([
            'status' => TimesheetDocumentReview::STATUS_ADJUSTMENT_REQUESTED,
            'reviewed_at' => now(),
            'adjustment_comment' => $comment,
            'adjustment_status' => TimesheetDocumentReview::ADJUSTMENT_OPEN,
            'resolved_at' => null,
            'resolved_by' => null,
            'admin_notes' => null,
        ]);

        self::recordEvent($review, TimesheetDocumentReviewEvent::ADJUSTMENT_REQUESTED, 'driver', $review->driver_id, [
            'comment' => $comment,
            'driver_name' => $review->driver_name,
            'driver_email' => $review->driver_email,
        ]);

        DriverNotification::create([
            'tenant_id' => $review->tenant_id,
            'driver_id' => $review->driver_id,
            'type' => 'timesheet_adjustment_requested',
            'title' => 'Adjustment request received',
            'message' => 'Your adjustment request was submitted. Admin will update the documents and send them again for review.',
            'meta' => [
                'timesheet_id' => $review->timesheet_id,
                'review_id' => $review->id,
            ],
            'created_by_user_id' => null,
        ]);

        return $review->fresh([
            'invoiceDocument',
            'calculationDocument',
            'events',
        ]);
    }

    /**
     * Admin: update handling status for a driver adjustment request.
     *
     * @param  'open'|'in_progress'|'resolved'|'dismissed'  $adjustmentStatus
     */
    public static function updateAdjustmentHandling(
        TimesheetDocumentReview $review,
        string $adjustmentStatus,
        ?string $adminNotes,
        ?int $adminUserId
    ): TimesheetDocumentReview {
        if ($review->status !== TimesheetDocumentReview::STATUS_ADJUSTMENT_REQUESTED) {
            throw new RuntimeException('This review is not an adjustment request.');
        }

        $allowed = [
            TimesheetDocumentReview::ADJUSTMENT_OPEN,
            TimesheetDocumentReview::ADJUSTMENT_IN_PROGRESS,
            TimesheetDocumentReview::ADJUSTMENT_RESOLVED,
            TimesheetDocumentReview::ADJUSTMENT_DISMISSED,
        ];
        if (! in_array($adjustmentStatus, $allowed, true)) {
            throw new RuntimeException('Invalid adjustment status.');
        }

        $payload = [
            'adjustment_status' => $adjustmentStatus,
        ];
        if ($adminNotes !== null) {
            $payload['admin_notes'] = trim($adminNotes) !== '' ? trim($adminNotes) : null;
        }

        if (in_array($adjustmentStatus, [
            TimesheetDocumentReview::ADJUSTMENT_RESOLVED,
            TimesheetDocumentReview::ADJUSTMENT_DISMISSED,
        ], true)) {
            $payload['resolved_at'] = now();
            $payload['resolved_by'] = $adminUserId;
        } else {
            $payload['resolved_at'] = null;
            $payload['resolved_by'] = null;
        }

        $review->update($payload);

        self::recordEvent(
            $review,
            TimesheetDocumentReviewEvent::ADJUSTMENT_STATUS_UPDATED,
            'admin',
            $adminUserId,
            [
                'adjustment_status' => $adjustmentStatus,
                'admin_notes' => $payload['admin_notes'] ?? $review->admin_notes,
            ]
        );

        return $review->fresh([
            'timesheet.employer',
            'driver.user',
            'sender:id,name',
            'resolver:id,name',
            'events',
        ]);
    }

    public static function documentForType(
        TimesheetDocumentReview $review,
        string $type
    ): TimesheetDocument {
        if ($type === TimesheetDocument::TYPE_INVOICE) {
            return $review->invoiceDocument;
        }
        if ($type === TimesheetDocument::TYPE_CALCULATION_SHEET) {
            return $review->calculationDocument;
        }

        throw new RuntimeException('Invalid document type.');
    }

    public static function frontendReviewUrl(string $token): string
    {
        $base = rtrim((string) env('FRONTEND_URL', 'http://localhost:3001'), '/');

        return $base.'/review/timesheet/'.$token;
    }

    public static function apiDocumentUrl(string $token, string $type): string
    {
        $base = rtrim((string) config('app.url'), '/');

        return $base.'/api/v1/timesheet-document-review/'.$token.'/documents/'.$type;
    }

    public static function recordDocumentViewed(
        TimesheetDocumentReview $review,
        string $documentType
    ): void {
        self::recordEvent($review, TimesheetDocumentReviewEvent::DOCUMENT_VIEWED, 'driver', $review->driver_id, [
            'document_type' => $documentType,
        ]);
    }

    private static function sendEmail(
        TimesheetDocumentReview $review,
        Timesheet $timesheet,
        TimesheetDocument $invoice,
        TimesheetDocument $calculation,
        string $token
    ): void {
        $driverName = $review->driver_name ?: 'Driver';
        $period = self::periodLabel($timesheet);
        $reviewUrl = self::frontendReviewUrl($token);
        $approveUrl = $reviewUrl.'?action=approve';
        $adjustUrl = $reviewUrl.'?action=adjust';
        $invoiceUrl = self::apiDocumentUrl($token, TimesheetDocument::TYPE_INVOICE);
        $calcUrl = self::apiDocumentUrl($token, TimesheetDocument::TYPE_CALCULATION_SHEET);
        $company = EmailTemplateService::companyName($timesheet->tenant_id);

        $invoiceBinary = Storage::disk('public')->get($invoice->file_path);
        $calcBinary = Storage::disk('public')->get($calculation->file_path);

        $contacts = EmailTemplateService::legacyContactEmails($timesheet->tenant_id);

        $vars = [
            'company_name' => $company,
            'period' => $period,
            'driver_name' => $driverName,
            'review_url' => $reviewUrl,
            'approve_url' => $approveUrl,
            'adjust_url' => $adjustUrl,
            'invoice_url' => $invoiceUrl,
            'calculation_url' => $calcUrl,
            'adjustments_email' => $contacts['adjustments_email'],
            'clearance_email' => $contacts['clearance_email'],
        ];

        $template = EmailTemplateService::findActive(
            $timesheet->tenant_id,
            \App\Models\EmailTemplate::KEY_TIMESHEET_DOCUMENT_REVIEW
        );

        if ($template) {
            $rendered = EmailTemplateService::renderTemplate($template, $vars);
        } else {
            $rendered = [
                'subject' => "Timesheet review – {$period}",
                'body_html' => '<p>Hi '.e($driverName).',</p><p>Your documents for '.e($period).' are ready.</p>',
                'body_text' => "Hi {$driverName},\n\nYour documents for {$period} are ready.\n{$reviewUrl}",
            ];
        }

        $fromName = $company !== '' ? $company : (string) config('app.name', 'R&B Services');

        Mail::to($review->driver_email)->send(new TimesheetDocumentReviewMail(
            emailSubject: $rendered['subject'],
            htmlBody: $rendered['body_html'],
            plainBody: $rendered['body_text'],
            invoiceFilename: $invoice->original_filename,
            invoiceBinary: $invoiceBinary,
            calculationFilename: $calculation->original_filename,
            calculationBinary: $calcBinary,
            fromName: $fromName,
        ));
    }

    private static function periodLabel(Timesheet $timesheet): string
    {
        $start = $timesheet->week_start_date?->format('M j, Y') ?? '';
        $end = $timesheet->week_end_date?->format('M j, Y') ?? '';

        return trim("{$start} – {$end}", ' –');
    }

    private static function recordEvent(
        TimesheetDocumentReview $review,
        string $eventType,
        ?string $actorType,
        ?int $actorId,
        ?array $meta = null
    ): void {
        TimesheetDocumentReviewEvent::create([
            'timesheet_document_review_id' => $review->id,
            'event_type' => $eventType,
            'actor_type' => $actorType,
            'actor_id' => $actorId,
            'meta' => $meta,
        ]);
    }
}
