<?php

namespace App\Services;

use App\Mail\WebsiteFormSubmissionMail;
use App\Models\CareerGrowthRegistration;
use App\Models\ContactSubmission;
use App\Models\JobApplication;
use App\Models\NewsletterSubscriber;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class WebsiteFormNotificationService
{
    public static function notifyContact(ContactSubmission $submission): void
    {
        $name = trim((string) ($submission->name ?: ($submission->first_name.' '.$submission->last_name)));
        $formName = (string) ($submission->form_name ?: 'Contact Form');

        self::send(
            $formName,
            $formName.': '.$name,
            [
                'Form' => $formName,
                'Name' => $name,
                'Email' => $submission->email,
                'Phone' => $submission->phone,
                'Location' => $submission->location,
                'Role' => $submission->role === 'employer' ? 'Employer' : ($submission->role === 'seeker' ? 'Job Seeker' : $submission->role),
                'Subject' => $submission->subject,
                'Message' => $submission->message,
                'Source' => $submission->source,
            ],
            $submission->email,
            $name,
        );
    }

    public static function notifyJobApplication(JobApplication $application): void
    {
        $name = trim($application->first_name.' '.$application->last_name);
        $formName = (string) ($application->application_form_name ?: 'Job Application');

        self::send(
            $formName,
            $formName.': '.$application->job_title.' - '.$name,
            [
                'Form' => $formName,
                'Position' => $application->job_title,
                'Name' => $name,
                'Email' => $application->email,
                'Phone' => $application->phone,
                'City' => $application->city,
                'Availability' => $application->availability,
                'Immigration status' => $application->immigration_status,
                'Licence' => $application->license_type
                    ? $application->license_type.' - '.$application->az_license_age
                    : 'Not applicable',
                'Experience' => $application->experience,
                'Referred by' => $application->referred_by ?: 'Not provided',
                'Resume' => $application->resume_original_name ?: 'Not uploaded',
                'Message' => $application->message,
            ],
            $application->email,
            $name,
            $application->resume_path,
            $application->resume_original_name,
        );
    }

    public static function notifyCareerGrowth(CareerGrowthRegistration $registration): void
    {
        $name = trim($registration->first_name.' '.$registration->last_name);
        $formName = (string) ($registration->form_name ?: 'Career Growth Course Application');

        self::send(
            $formName,
            $formName.': '.$registration->course.' - '.$name,
            [
                'Form' => $formName,
                'Name' => $name,
                'Email' => $registration->email,
                'Phone' => $registration->phone,
                'Current status' => $registration->current_status,
                'Course' => $registration->course,
            ],
            $registration->email,
            $name,
        );
    }

    public static function notifyNewsletter(NewsletterSubscriber $subscriber): void
    {
        self::send(
            'Subscribe Form',
            'Newsletter subscription: '.$subscriber->email,
            [
                'Form' => 'Subscribe Form',
                'Name' => $subscriber->name,
                'Email' => $subscriber->email,
                'Type' => $subscriber->subscriber_type ?: $subscriber->role,
                'Source' => $subscriber->source,
            ],
            $subscriber->email,
            $subscriber->name,
        );
    }

    /**
     * @param  array<string, string|null>  $fields
     */
    private static function send(
        string $formName,
        string $subject,
        array $fields,
        ?string $replyToEmail = null,
        ?string $replyToName = null,
        ?string $attachmentPath = null,
        ?string $attachmentName = null,
    ): void {
        $to = self::recipient();
        if ($to === null) {
            Log::error('Website form notification email is not configured.', ['form' => $formName]);

            return;
        }

        [$fromAddress, $fromName] = self::fromAddress($to);
        $mailable = new WebsiteFormSubmissionMail(
            $subject,
            $formName,
            $fields,
            $fromAddress,
            $fromName,
            $replyToEmail,
            $replyToName,
            $attachmentPath,
            $attachmentName,
        );

        $errors = [];
        foreach (self::mailerNames() as $mailer) {
            try {
                Mail::mailer($mailer)
                    ->to([new Address($to, 'R&B Services Plus')])
                    ->send($mailable);
                Log::info('Website form notification email sent.', [
                    'form' => $formName,
                    'to' => $to,
                    'mailer' => $mailer,
                ]);

                return;
            } catch (\Throwable $exception) {
                $errors[$mailer] = $exception->getMessage();
            }
        }

        Log::error('Website form notification email could not be sent.', [
            'form' => $formName,
            'to' => $to,
            'errors' => $errors,
        ]);
    }

    private static function recipient(): ?string
    {
        $to = strtolower(trim((string) config('website.form_notification_email', 'info@gennextglobaltech.ca')));
        if ($to === '' || ! filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $to = 'info@gennextglobaltech.ca';
        }

        return filter_var($to, FILTER_VALIDATE_EMAIL) ? $to : null;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private static function fromAddress(string $fallback): array
    {
        $from = strtolower(trim((string) config('mail.from.address', '')));
        $name = trim((string) config('mail.from.name', 'R&B Services Plus'));
        if ($name === '' || str_contains($name, '${')) {
            $name = 'R&B Services Plus';
        }

        if ($from === '' || ! filter_var($from, FILTER_VALIDATE_EMAIL) || str_ends_with($from, '@example.com')) {
            $from = $fallback;
        }

        return [$from, $name];
    }

    /**
     * Use the configured Laravel mailer (SMTP / SES / etc). If that mailer only
     * writes to the log, fall back to the host sendmail used on cPanel.
     *
     * @return list<string>
     */
    private static function mailerNames(): array
    {
        if (app()->runningUnitTests()) {
            return [(string) config('mail.default', 'array')];
        }

        $default = (string) config('mail.default', 'log');
        $mailers = [];
        if (! in_array($default, ['log', 'array'], true)) {
            $mailers[] = $default;
        }
        $mailers[] = 'cpanel';
        $mailers[] = 'sendmail';

        return array_values(array_unique($mailers));
    }
}
