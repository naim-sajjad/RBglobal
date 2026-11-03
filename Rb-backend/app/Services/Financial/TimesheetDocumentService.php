<?php

namespace App\Services\Financial;

use App\Models\Timesheet;
use App\Models\TimesheetDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class TimesheetDocumentService
{
    public const SPREADSHEET_EXTENSIONS = ['xlsx', 'xls', 'csv'];

    public static function isSpreadsheetFilename(?string $filename): bool
    {
        $ext = strtolower(pathinfo((string) $filename, PATHINFO_EXTENSION));

        return in_array($ext, self::SPREADSHEET_EXTENSIONS, true);
    }
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
        $ext = strtolower($file->getClientOriginalExtension() ?: 'bin');
        if ($ext === '') {
            $ext = 'bin';
        }
        $storedName = Str::uuid()->toString().'.'.$ext;
        $directory = self::storageDirectory($timesheet);
        $path = $file->storeAs($directory, $storedName, 'public');

        $parsed = null;
        if (self::isSpreadsheetFilename($originalName) || in_array($ext, self::SPREADSHEET_EXTENSIONS, true)) {
            $absolute = Storage::disk('public')->path($path);
            try {
                $parsed = CalculationSheetParser::parseFile($absolute);
            } catch (RuntimeException) {
                $parsed = null;
            }
        }

        $document = TimesheetDocument::create([
            'timesheet_id' => $timesheet->id,
            'tenant_id' => $timesheet->tenant_id,
            'document_type' => $documentType,
            'source' => TimesheetDocument::SOURCE_UPLOADED,
            'file_path' => $path,
            'original_filename' => $originalName,
            'file_size' => $file->getSize() ?: null,
            'parsed_payload' => $parsed,
            'mime_type' => $file->getMimeType() ?: null,
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

    /**
     * Generate an invoice PDF from a parsed calculation spreadsheet.
     */
    public static function generateInvoiceFromCalculation(
        Timesheet $timesheet,
        TimesheetDocument $calculation,
        ?int $userId = null
    ): TimesheetDocument {
        $parsed = null;
        if ($calculation->file_path && Storage::disk('public')->exists($calculation->file_path)
            && self::isSpreadsheetFilename($calculation->original_filename)) {
            $parsed = CalculationSheetParser::parseFile(Storage::disk('public')->path($calculation->file_path));
            $calculation->update(['parsed_payload' => $parsed]);
        } elseif (is_array($calculation->parsed_payload)) {
            $parsed = $calculation->parsed_payload;
        }
        if (! is_array($parsed)) {
            throw new RuntimeException('The calculation sheet could not be read. Check the Excel columns (item, qty, rate, amount).');
        }

        $lines = is_array($parsed['lines'] ?? null) ? $parsed['lines'] : [];
        $invoiceLines = [];
        foreach ($lines as $line) {
            if (! empty($line['is_tax'])) {
                continue;
            }
            $invoiceLines[] = $line;
        }
        $subtotal = (float) ($parsed['subtotal'] ?? 0);
        if ($subtotal <= 0) {
            $sum = 0.0;
            foreach ($invoiceLines as $line) {
                $sum += (float) ($line['amount'] ?? 0);
            }
            $subtotal = round($sum, 2);
        }
        if ($invoiceLines === [] && $subtotal <= 0) {
            throw new RuntimeException('No payable amounts were found in the calculation sheet.');
        }

        $binary = FinancialPdfService::timesheetInvoicePdfBinaryFromLines($timesheet, $invoiceLines, $subtotal);
        $path = self::storeBinary($timesheet, $binary['content'], $binary['filename']);

        $existing = TimesheetDocument::query()
            ->where('timesheet_id', $timesheet->id)
            ->where('document_type', TimesheetDocument::TYPE_INVOICE)
            ->where('source', TimesheetDocument::SOURCE_GENERATED)
            ->get();
        foreach ($existing as $doc) {
            self::deleteFile($doc);
            $doc->delete();
        }

        return TimesheetDocument::create([
            'timesheet_id' => $timesheet->id,
            'tenant_id' => $timesheet->tenant_id,
            'document_type' => TimesheetDocument::TYPE_INVOICE,
            'source' => TimesheetDocument::SOURCE_GENERATED,
            'file_path' => $path,
            'original_filename' => $binary['filename'],
            'file_size' => strlen($binary['content']),
            'mime_type' => 'application/pdf',
            'parsed_payload' => [
                'from_calculation_id' => $calculation->id,
                'subtotal' => $subtotal,
                'total' => $parsed['total'] ?? $subtotal,
            ],
            'created_by' => $userId,
        ]);
    }

    public static function previewPayload(TimesheetDocument $document): ?array
    {
        if (! $document->file_path || ! Storage::disk('public')->exists($document->file_path)
            || (! self::isSpreadsheetFilename($document->original_filename)
                && ! self::isSpreadsheetFilename($document->file_path))) {
            return is_array($document->parsed_payload) ? $document->parsed_payload : null;
        }

        $parsed = CalculationSheetParser::parseFile(Storage::disk('public')->path($document->file_path));
        $document->update(['parsed_payload' => $parsed]);

        return $parsed;
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
            TimesheetDocument::TYPE_TIMESHEET,
        ], true)) {
            abort(422, 'Invalid document type.');
        }
    }

    private static function defaultFilename(Timesheet $timesheet, string $documentType): string
    {
        $label = match ($documentType) {
            TimesheetDocument::TYPE_INVOICE => 'Invoice',
            TimesheetDocument::TYPE_TIMESHEET => 'Timesheet',
            default => 'Calculation',
        };

        return 'timesheet-'.$timesheet->id.'-'.$label.'.pdf';
    }
}
