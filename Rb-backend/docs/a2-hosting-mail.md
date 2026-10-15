# A2 Hosting mail (admin emails)

Admin emails (pay stubs, timesheet document reviews, timesheet adjustment notices, newsletter campaigns) send through Laravel’s **admin** SMTP mailer (`MAIL_*`). If SMTP fails, the app falls back to cPanel `sendmail` on the A2 server.

## Mailbox (cPanel)

| Setting | Value |
|---|---|
| Username | `noreply@gennextglobaltech.ca` |
| Password | That mailbox’s password |
| Incoming server | `mail.gennextglobaltech.ca` (IMAP 993 / POP3 995) |
| Outgoing server | `mail.gennextglobaltech.ca` |
| SMTP port | **465** (SSL) |
| Auth | Required for IMAP, POP3, and SMTP |

The **From** address must be this same mailbox. Other From addresses are often rejected as spoofing.

## `.env`

```env
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_ENCRYPTION=ssl
MAIL_HOST=mail.gennextglobaltech.ca
MAIL_PORT=465
MAIL_USERNAME=noreply@gennextglobaltech.ca
MAIL_PASSWORD=the-mailbox-password
MAIL_FROM_ADDRESS=noreply@gennextglobaltech.ca
MAIL_FROM_NAME="R&B Services Plus"
```

**Local Docker cannot reach A2 SMTP.** The app host and HTTPS (443) resolve, but ports 465/587 time out. That is a firewall drop (A2 SMTP restrictions and/or your ISP/Docker blocking outbound SMTP). `cpanel`/`sendmail` also fail inside Sail because those binaries are not the cPanel mail server.

Send a real test from the **A2 account** (SSH / cPanel terminal), not from Sail:

```bash
php artisan config:clear
php artisan mail:test you@example.com
```

On A2, if remote SMTP is still blocked, set:

```env
MAIL_HOST=127.0.0.1
MAIL_PORT=465
```

or rely on the sendmail fallback. In cPanel, turn off **SMTP Restrictions** (or allow remote SMTP) if you need to send from your laptop/Docker.

If port **465** is blocked, use STARTTLS on **587**:

```env
MAIL_SCHEME=
MAIL_ENCRYPTION=tls
MAIL_PORT=587
```

After changing `.env` on the server:

```bash
php artisan config:clear
php artisan config:cache
```

## Test

From admin: **Settings → Company profile → Outbound email → Send test**.

From the server:

```bash
php artisan mail:test you@example.com
```

Website contact forms still use the separate `website` mailer (`WEBSITE_MAIL_*`).
