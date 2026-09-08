<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $formName }}</title>
</head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f3f4f6;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;">
                    <tr>
                        <td style="padding:32px;background:#075da8;color:#ffffff;">
                            <p style="margin:0 0 8px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">Website form entry</p>
                            <h1 style="margin:0;font-size:24px;">{{ $formName }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">
                                A new submission was received on the public website and saved in the dashboard under Website → Forms and Submissions.
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                                @foreach ($fields as $label => $value)
                                    <tr>
                                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;width:180px;color:#6b7280;font-size:13px;vertical-align:top;">{{ $label }}</td>
                                        <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;line-height:1.5;white-space:pre-wrap;">{{ filled($value) ? $value : '—' }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
