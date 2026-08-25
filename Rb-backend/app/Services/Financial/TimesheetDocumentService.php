<?php

namespace App\Services\Financial;

use App\Models\Timesheet;
use App\Models\TimesheetDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TimesheetDocumentService
{
    public static function generate(Timesheet $timesheet, string $documentType, ?int $userId = null): TimesheetDocument
    {
        self::assertDocumentType($documentType);

        $binary = $documentType === TimesheetDocument::TYPE_INVOICE
            ? FinancialPdfService::timesheetInvoicePdfBinary($timesheet)
            : FinancialPdfService::timesheetCalculationPdfBinary($timesheet);

        $path = self::storeBinary(
            $timesheet,
            $binary['content'],
            $binary['filename']
        );

        $document = TimesheetDocument::create([
            'timesheet_id' => $timesheet->id,
            'tenant_id' => $timesheet->tenant_id,
            'document_type' => $documentType,
            'source' => TimesheetDocument::SOURCE_GENERATED,
            'file_path' => $path,
            'original_filename' => $binary['filename'],
            'file_size' => strlen($binary['content']),
            'created_by' => $userId,
        ]);

        TimesheetDocumentReviewService::supersedePendingForTimesheet(
            $timesheet,
            'Document regenerated: '.$documentType,
            'admin',
            $userId
        );

        return $document;
    }

    public static function upload(
        Timesheet $timesheet,
        string $documentType,
        UploadedFile $file,
        ?int $userId = null,
        bool $replaceExisting = true
    ): TimesheetDocument {
        self::assertDocumentType($documentType);

        if ($replaceExisting) {
            $existing = TimesheetDocument::query()
                ->where('timesheet_id', $timesheet->id)
                ->where('document_type', $documentType)
                ->where('source', TimesheetDocument::SOURCE_UPLOADED)
                ->get();
            foreach ($existing as $doc) {
                self::deleteFile($doc);
                $doc->delete();
            }
        }

        $originalName = $file->getClientOriginalName() ?: self::defaultFilename($timesheet, $documentType);
        $storedName = Str::uuid()->toString().'.pdf';
        $directory = self::storageDirectory($timesheet);
        $path = $file->storeAs($directory, $storedName, 'public');

        $document = TimesheetDocument::create([
            'timesheet_id' => $timesheet->id,
            'tenant_id' => $timesheet->tenant_id,
            'document_type' => $documentType,
            'source' => TimesheetDocument::SOURCE_UPLOADED,
            'file_path' => $path,
            'original_filename' => $originalName,
            'file_size' => $file->getSize() ?: null,
            'created_by' => $userId,
        ]);

        TimesheetDocumentReviewService::supersedePendingForTimesheet(
            $timesheet,
            'Document uploaded: '.$documentType,
            'admin',
            $userId
        );

        return $document;
    }

    public static function deleteDocument(TimesheetDocument $document): void
    {
        self::deleteFile($document);
        $document->delete();
    }

    public static function hasGenerated(Timesheet $timesheet, string $documentType): bool
    {
        return TimesheetDocument::query()
            ->where('timesheet_id', $timesheet->id)
            ->where('document_type', $documentType)
            ->where('source', TimesheetDocument::SOURCE_GENERATED)
            ->exists();
    }

    private static function storeBinary(Timesheet $timesheet, string $content, string $originalFilename): string
    {
        $storedName = Str::uuid()->toString().'.pdf';
        $path = self::storageDirectory($timesheet).'/'.$storedName;
        Storage::disk('public')->put($path, $content);

        return $path;
    }

    private static function storageDirectory(Timesheet $timesheet): string
    {
        return 'timesheets/'.$timesheet->id.'/documents';
    }

    private static function deleteFile(TimesheetDocument $document): void
    {
        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }
    }

    private static function assertDocumentType(string $documentType): void
    {
        if (! in_array($documentType, [
            TimesheetDocument::TYPE_INVOICE,
            TimesheetDocument::TYPE_CALCULATION_SHEET,
        ], true)) {
            abort(422, 'Invalid document type.');
        }
    }

    private static function defaultFilename(Timesheet $timesheet, string $documentType): string
    {
        $label = $documentType === TimesheetDocument::TYPE_INVOICE ? 'Invoice' : 'Calculation';

        return 'timesheet-'.$timesheet->id.'-'.$label.'.pdf';
    }
}
