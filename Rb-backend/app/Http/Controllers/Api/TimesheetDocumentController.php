<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timesheet;
use App\Models\TimesheetDocument;
use App\Services\Financial\TimesheetDocumentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TimesheetDocumentController extends Controller
{
    protected function getCurrentDriverId(): ?int
    {
        $user = auth()->user();
        $driver = \App\Models\Driver::where('user_id', $user->id)
            ->where('tenant_id', tenant('id'))
            ->first();

        return $driver?->id;
    }

    protected function isStaff(): bool
    {
        return (bool) auth()->user()?->hasPermissionTo('drivers.view');
    }

    /**
     * Staff or the owning driver may access documents for this timesheet.
     */
    protected function assertTimesheetAccess(Timesheet $timesheet): void
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }

        if ($this->isStaff()) {
            return;
        }

        $driverId = $this->getCurrentDriverId();
        if ($driverId && (int) $timesheet->driver_id === (int) $driverId) {
            return;
        }

        abort(403, 'Unauthorized');
    }

    /** Generate / regenerate remains staff-only. */
    protected function assertStaffOnly(Timesheet $timesheet): void
    {
        $this->assertTimesheetAccess($timesheet);
        if (! $this->isStaff()) {
            abort(403, 'Only staff can generate documents.');
        }
    }

    protected function assertDocumentBelongsToTimesheet(Timesheet $timesheet, TimesheetDocument $document): void
    {
        if ((int) $document->timesheet_id !== (int) $timesheet->id) {
            abort(404);
        }
        if ($document->tenant_id !== null && $document->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
    }

    public function index(Timesheet $timesheet)
    {
        $this->assertTimesheetAccess($timesheet);

        $documents = $timesheet->documents()
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->get();

        foreach ($documents as $document) {
            if ($document->document_type === TimesheetDocument::TYPE_CALCULATION_SHEET) {
                TimesheetDocumentService::previewPayload($document);
            }
        }

        return response()->json($documents);
    }

    public function generate(Request $request, Timesheet $timesheet)
    {
        $this->assertStaffOnly($timesheet);

        $validated = $request->validate([
            'document_type' => 'required|in:invoice,calculation_sheet',
            'confirm_regenerate' => 'nullable|boolean',
        ]);

        $documentType = $validated['document_type'];
        if (
            TimesheetDocumentService::hasGenerated($timesheet, $documentType)
            && empty($validated['confirm_regenerate'])
        ) {
            return response()->json([
                'message' => 'A generated document of this type already exists.',
                'requires_confirmation' => true,
            ], 409);
        }

        $timesheet->load(['driver.user', 'employer', 'trips.employer']);
        $document = TimesheetDocumentService::generate(
            $timesheet,
            $documentType,
            auth()->id()
        );

        return response()->json($document->load('creator:id,name'), 201);
    }

    public function upload(Request $request, Timesheet $timesheet)
    {
        $this->assertTimesheetAccess($timesheet);

        $allowedTypes = $this->isStaff()
            ? 'invoice,calculation_sheet,timesheet'
            : 'invoice,calculation_sheet,timesheet';

        $validated = $request->validate([
            'document_type' => 'required|in:'.$allowedTypes,
            'file' => 'required|file|max:10240',
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension() ?: '');
        $isSpreadsheet = in_array($ext, TimesheetDocumentService::SPREADSHEET_EXTENSIONS, true);
        $isPdf = $ext === 'pdf';
        if (! $isPdf && ! $isSpreadsheet) {
            return response()->json([
                'message' => 'Upload a PDF or Excel file (.xlsx, .xls, or .csv).',
            ], 422);
        }
        $type = $validated['document_type'];

        if (! $this->isStaff()) {
            if ($type === TimesheetDocument::TYPE_INVOICE && ! $isPdf) {
                return response()->json([
                    'message' => 'Invoices must be a PDF. Upload a calculation sheet, then request an invoice.',
                ], 422);
            }
            if ($type === TimesheetDocument::TYPE_CALCULATION_SHEET && ! $isSpreadsheet) {
                return response()->json([
                    'message' => 'Calculation sheets must be Excel files (.xlsx, .xls, or .csv).',
                ], 422);
            }
            if ($type === TimesheetDocument::TYPE_TIMESHEET && ! $isPdf && ! $isSpreadsheet) {
                return response()->json([
                    'message' => 'Timesheets must be a PDF or Excel file (.xlsx, .xls, or .csv).',
                ], 422);
            }
        }

        $document = TimesheetDocumentService::upload(
            $timesheet,
            $type,
            $file,
            auth()->id(),
            true
        );

        return response()->json([
            'document' => $document->load('creator:id,name'),
            'preview' => $document->parsed_payload,
        ], 201);
    }

    public function requestInvoice(Timesheet $timesheet)
    {
        $this->assertTimesheetAccess($timesheet);

        $calculation = $timesheet->documents()
            ->where('document_type', TimesheetDocument::TYPE_CALCULATION_SHEET)
            ->orderByDesc('created_at')
            ->first();

        if (! $calculation) {
            return response()->json([
                'message' => 'Upload a calculation sheet in Excel before requesting an invoice.',
            ], 422);
        }

        try {
            $invoice = TimesheetDocumentService::generateInvoiceFromCalculation(
                $timesheet,
                $calculation,
                auth()->id()
            )->load('creator:id,name');
        } catch (\Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'invoice' => $invoice,
            'preview' => $calculation->parsed_payload,
        ], 201);
    }

    public function preview(Timesheet $timesheet, TimesheetDocument $document)
    {
        $this->assertTimesheetAccess($timesheet);
        $this->assertDocumentBelongsToTimesheet($timesheet, $document);

        try {
            $preview = TimesheetDocumentService::previewPayload($document);
        } catch (\Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        if ($preview === null) {
            return response()->json(['message' => 'No spreadsheet preview is available for this file.'], 422);
        }

        return response()->json($preview);
    }

    public function download(Timesheet $timesheet, TimesheetDocument $document)
    {
        $this->assertTimesheetAccess($timesheet);
        $this->assertDocumentBelongsToTimesheet($timesheet, $document);

        if (! $document->file_path || ! Storage::disk('public')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('public')->download(
            $document->file_path,
            $document->original_filename
        );
    }

    public function view(Timesheet $timesheet, TimesheetDocument $document)
    {
        $this->assertTimesheetAccess($timesheet);
        $this->assertDocumentBelongsToTimesheet($timesheet, $document);

        if (! $document->file_path || ! Storage::disk('public')->exists($document->file_path)) {
            abort(404, 'File not found.');
        }

        $filename = addslashes($document->original_filename);
        $mime = $document->mime_type
            ?: (TimesheetDocumentService::isSpreadsheetFilename($document->original_filename)
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/pdf');

        return new StreamedResponse(function () use ($document) {
            echo Storage::disk('public')->get($document->file_path);
        }, 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function destroy(Timesheet $timesheet, TimesheetDocument $document)
    {
        $this->assertTimesheetAccess($timesheet);
        $this->assertDocumentBelongsToTimesheet($timesheet, $document);

        if (! $this->isStaff()) {
            $ownUpload = $document->source === TimesheetDocument::SOURCE_UPLOADED
                && in_array($document->document_type, [
                    TimesheetDocument::TYPE_INVOICE,
                    TimesheetDocument::TYPE_CALCULATION_SHEET,
                    TimesheetDocument::TYPE_TIMESHEET,
                ], true);
            if (! $ownUpload) {
                abort(403, 'You can only delete files you uploaded.');
            }
        }

        TimesheetDocumentService::deleteDocument($document);

        return response()->json(null, 204);
    }
}
