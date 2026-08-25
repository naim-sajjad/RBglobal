<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Timesheet review</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:24px 28px 8px;">
              <p style="margin:0 0 12px;font-size:16px;">Hi {{ $driverName }},</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#3f3f46;">
                Your timesheet documents for <strong>{{ $periodLabel }}</strong> are ready for review.
                Please open the calculation sheet and invoice, then confirm everything looks correct
                or request an adjustment if something needs to change.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:0 0 10px;">
                    <a href="{{ $invoiceViewUrl }}" style="display:inline-block;padding:10px 16px;background:#27272a;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
                      View Invoice
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 16px;">
                    <a href="{{ $calculationViewUrl }}" style="display:inline-block;padding:10px 16px;background:#27272a;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">
                      View Calculation Sheet
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0 10px;">
                    <a href="{{ $approveUrl }}" style="display:inline-block;padding:12px 18px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:700;">
                      I Reviewed – Everything Is OK
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 8px;">
                    <a href="{{ $adjustUrl }}" style="display:inline-block;padding:10px 16px;background:#fff;color:#b91c1c;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;border:1px solid #fecaca;">
                      Request an adjustment
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 24px;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#71717a;">
                Both PDFs are also attached to this email. You can open the full review page here:
              </p>
              <p style="margin:0;font-size:12px;word-break:break-all;">
                <a href="{{ $reviewUrl }}" style="color:#2563eb;">{{ $reviewUrl }}</a>
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#a1a1aa;">
                This link expires in 14 days. If documents are updated later, this link will stop working and you will receive a new email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
