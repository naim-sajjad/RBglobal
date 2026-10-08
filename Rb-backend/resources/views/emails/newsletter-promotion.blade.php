<!doctype html>
<html><head><meta charset="utf-8"><title>{{ $promotionSubject }}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#172033">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 16px" align="center">
<table role="presentation" width="100%" style="max-width:640px;background:white"><tr><td style="padding:28px;background:#075da8;color:white;font-size:22px;font-weight:bold">R&amp;B Services Plus</td></tr>
<tr><td style="padding:28px;line-height:1.7">{!! $body !!}</td></tr>
<tr><td style="padding:24px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px">R&amp;B Services Plus Inc.<br>25 Watline Ave, Mississauga, ON L4Z 2Z1, Canada<br>
@if($unsubscribeUrl)<p>You subscribed to our newsletter. <a href="{{ $unsubscribeUrl }}">Unsubscribe</a></p>@else<p>This is a test preview. No subscribers received this email.</p>@endif
</td></tr></table></td></tr></table></body></html>
