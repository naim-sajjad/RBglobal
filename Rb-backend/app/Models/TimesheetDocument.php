<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TimesheetDocument extends Model
{
    use HasFactory;

    public const TYPE_INVOICE = 'invoice';

    public const TYPE_CALCULATION_SHEET = 'calculation_sheet';

    public const SOURCE_GENERATED = 'generated';

    public const SOURCE_UPLOADED = 'uploaded';

    protected $fillable = [
        'timesheet_id',
        'tenant_id',
        'document_type',
        'source',
        'file_path',
        'original_filename',
        'file_size',
        'created_by',
    ];

    protected $appends = ['file_url'];

    public function timesheet(): BelongsTo
    {
        return $this->belongsTo(Timesheet::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFileUrlAttribute(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        return Storage::disk('public')->url($this->file_path);
    }
}
