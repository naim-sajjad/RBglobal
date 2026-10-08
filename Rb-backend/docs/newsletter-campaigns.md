# Newsletter subscribers and campaigns

The admin menu exposes **Website → Forms and Submissions → Subscribers** and **Promotional emails**. Subscriber records remain in `newsletter_subscribers`; no contact submissions are copied into the mailing list.

Campaigns are drafts until an administrator reviews the eligible recipient count and confirms sending. Only active subscribers with consent are included. Eligibility is checked again immediately before each delivery. Each message contains an unsubscribe link. Campaign delivery counts indicate SMTP acceptance, not inbox placement or opens.

## Delivery setup

Configure Laravel's existing SMTP settings (`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, and `MAIL_FROM_NAME`) for the sender you intend to use. Keep credentials in environment configuration.

Start the dedicated local worker with:

```sh
docker compose up -d --no-deps newsletter-worker
```

On a production server, supervise the equivalent command:

```sh
php artisan queue:work --queue=newsletter --sleep=3 --tries=1 --timeout=60
```

The worker processes only the `newsletter` queue. Dispatch occurs after the campaign transaction commits, following [Laravel's queue transaction guidance](https://laravel.com/framework/docs/12.x/queues#jobs-and-database-transactions).

Use **Send test email** with your own address before confirming a campaign. Test messages do not go to subscribers. Failed deliveries are recorded and are not automatically resent, which avoids duplicates after ambiguous transport errors.

## Validation

`php artisan test --filter=NewsletterCampaignTest` uses fake mail and queues. It covers audience/consent filtering, rechecking unsubscribe status, duplicate dispatch protection, test-address isolation, immutable sent campaigns, and empty audiences.
