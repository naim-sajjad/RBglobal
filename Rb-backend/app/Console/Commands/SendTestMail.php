<?php

namespace App\Console\Commands;

use App\Support\AdminMail;
use Illuminate\Console\Command;
use Illuminate\Contracts\Mail\Mailer;

class SendTestMail extends Command
{
    protected $signature = 'mail:test {email : Recipient address} {--subject=A2 Hosting mail test}';

    protected $description = 'Send a test email through the A2 Hosting / admin mailers';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Invalid email address.');

            return self::FAILURE;
        }

        $subject = (string) $this->option('subject');
        $body = 'This is a test message from '.(string) config('app.name')." via A2 Hosting mail.\n\nIf you received this, outbound email is working.";

        if (app()->configurationIsCached()) {
            $this->warn('Config is cached (bootstrap/cache/config.php). Values below may ignore .env. Run: php artisan config:clear');
        }

        $host = (string) config('mail.mailers.admin.host');
        $user = (string) config('mail.mailers.admin.username');
        $passwordSet = trim((string) config('mail.mailers.admin.password')) !== '';

        $this->info('Trying mailers: '.implode(', ', AdminMail::mailerNames()));
        $this->line('Host: '.$host);
        $this->line('Port: '.(string) config('mail.mailers.admin.port'));
        $this->line('Username: '.$user);
        $this->line('Password set: '.($passwordSet ? 'yes' : 'no'));
        $this->line('From: '.(string) config('mail.from.address'));

        if (! AdminMail::smtpConfigured()) {
            $this->error('SMTP is not ready. Set MAIL_PASSWORD in .env to the noreply@gennextglobaltech.ca mailbox password, then run php artisan config:clear.');

            return self::FAILURE;
        }

        try {
            $mailerUsed = AdminMail::send(function (Mailer $mailer) use ($email, $subject, $body): void {
                $mailer->raw($body, function ($message) use ($email, $subject): void {
                    $message->to($email)->subject($subject);
                });
            });
        } catch (\Throwable $exception) {
            $this->error($exception->getMessage());
            $this->newLine();
            $this->warn('Last logged mailer errors (also in storage/logs/laravel.log):');
            foreach (AdminMail::lastErrors() as $mailerName => $message) {
                $this->line("  [{$mailerName}] {$message}");
            }

            return self::FAILURE;
        }

        $this->info("Test email sent to {$email} via {$mailerUsed}.");

        return self::SUCCESS;
    }
}
