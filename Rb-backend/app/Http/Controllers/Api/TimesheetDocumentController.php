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
    protected function assertTimesheetAccess(Timesheet $timesheet): void
    {
        if ($timesheet->tenant_id !== tenant('id')) {
            abort(403, 'Unauthorized');
        }
        if (! auth()->user()?->hasPermissionTo('drivers.view')) {
            abort(403, 'Unauthorized');
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

        return response()->json($documents);
    }

    public function generate(Request $request, Timesheet $timesheet)
    {
        $this->assertTimesheetAccess($timesheet);

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

        $validated = $request->validate([
            'document_type' => 'required|in:invoice,calculation_sheet',
            'file' => 'required|file|mimes:pdf|max:10240',
        ]);

        $document = TimesheetDocumentService::upload(
            $timesheet,
            $validated['document_type'],
            $request->file('file'),
            auth()->id(),
            true
        );

        return response()->json($document->load('creator:id,name'), 201);
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

        return new StreamedResponse(function () use ($document) {
            echo Storage::disk('public')->get($document->file_path);
        }, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.addslashes($document->original_filename).'"',
        ]);
    }

    public function destroy(Timesheet $timesheet, TimesheetDocument $document)
    {
        $this->assertTimesheetAccess($timesheet);
        $this->assertDocumentBelongsToTimesheet($timesheet, $document);

        TimesheetDocumentService::deleteDocument($document);

        return response()->json(null, 204);
    }
}
