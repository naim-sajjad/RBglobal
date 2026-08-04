<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Newsletter subscription confirmed</title>
</head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f3f4f6;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;">
                    <tr>
                        <td style="padding:32px;background:#075da8;color:#ffffff;">
                            <h1 style="margin:0;font-size:26px;">Thanks for subscribing!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
                                You are now subscribed to updates from R&amp;B Services Plus.
                            </p>
                            <p style="margin:0 0 24px;color:#4b5563;line-height:1.6;">
                                We’ll send you relevant job alerts, hiring tips and career insights.
                            </p>
                            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
                                No longer interested?
                                <a href="{{ url('/api/newsletter/unsubscribe/'.$subscriber->unsubscribe_token) }}" style="color:#075da8;">Unsubscribe here</a>.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
