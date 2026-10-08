<?php

namespace Tests\Feature;

use App\Support\FormSubmissionTimestamps;
use Carbon\Carbon;
use Tests\TestCase;

class FormSubmissionTimestampsTest extends TestCase
{
    public function test_database_times_include_utc_timezone_for_browser_display(): void
    {
        config(['app.timezone' => 'UTC']);
        $row = (object) ['submitted_at' => '2026-10-07 12:30:00', 'deleted_at' => null];
        $result = FormSubmissionTimestamps::serialize($row);
        $this->assertSame('2026-10-07T12:30:00.000000Z', $result->submitted_at);
        $this->assertSame('17:30', Carbon::parse($result->submitted_at)->setTimezone('Asia/Karachi')->format('H:i'));
        $this->assertNull($result->deleted_at);
        $this->assertSame('2026-10-07 12:30:00', $row->submitted_at);
    }

    public function test_trash_times_also_include_timezone_and_existing_offsets_are_preserved(): void
    {
        $result = FormSubmissionTimestamps::serialize((object) [
            'submitted_at' => '2026-10-07T17:30:00+05:00', 'deleted_at' => '2026-10-07 12:35:00',
        ]);
        $this->assertSame('2026-10-07T12:30:00.000000Z', $result->submitted_at);
        $this->assertSame('2026-10-07T12:35:00.000000Z', $result->deleted_at);
    }
}
