<?php

namespace App\Support;

use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Send admin-app email (pay stubs, timesheet reviews, newsletters, etc.)
 * through A2 Hosting SMTP, then cPanel sendmail if SMTP is unavailable.
 */
class AdminMail
{
    /** @var array<string, string> */
    private static array $lastErrors = [];

    /**
     * @return array<string, string>
     */
    public static function lastErrors(): array
    {
        return self::$lastErrors;
    }

    /**
     * @param  callable(Mailer): void  $send
     * @return string  Mailer name that succeeded
     */
    public static function send(callable $send): string
    {
        $errors = [];
        self::$lastErrors = [];

        foreach (self::mailerNames() as $mailerName) {
            try {
                $send(Mail::mailer($mailerName));

                return $mailerName;
            } catch (Throwable $exception) {
                $errors[$mailerName] = $exception->getMessage();
            }
        }

        self::$lastErrors = $errors;
        Log::error('Admin email could not be sent.', ['errors' => $errors]);

        throw new \RuntimeException(
            'Unable to send email. Check A2 Hosting MAIL_HOST / MAIL_USERNAME / MAIL_PASSWORD (or cPanel sendmail).'
        );
    }

    /**
     * @return list<string>
     */
    public static function mailerNames(): array
    {
        if (app()->runningUnitTests()) {
            return [(string) config('mail.default', 'array')];
        }

        $default = (string) config('mail.default', 'log');
        $mailers = [];
        $smtpReady = self::smtpConfigured();

        if ($smtpReady) {
            if ($default === 'smtp' || $default === 'admin') {
                $mailers[] = 'admin';
                $mailers[] = 'smtp';
            } elseif (! in_array($default, ['log', 'array', 'sendmail', 'cpanel'], true)) {
                $mailers[] = $default;
                $mailers[] = 'admin';
            } else {
                $mailers[] = 'admin';
                $mailers[] = 'smtp';
            }
        } elseif (! in_array($default, ['log', 'array', 'smtp', 'admin'], true)) {
            $mailers[] = $default;
        }

        $mailers[] = 'cpanel';
        $mailers[] = 'sendmail';

        return array_values(array_unique($mailers));
    }

    public static function smtpConfigured(): bool
    {
        $host = strtolower(trim((string) config('mail.mailers.admin.host')));
        $user = trim((string) config('mail.mailers.admin.username'));
        $pass = (string) config('mail.mailers.admin.password');

        if ($host === '' || $host === 'null') {
            return false;
        }

        // Local Mailpit / Mailhog does not require SMTP auth.
        if (in_array($host, ['mailpit', 'mailhog', '127.0.0.1', 'localhost'], true)) {
            return true;
        }

        return $user !== '' && $pass !== '';
    }
}
