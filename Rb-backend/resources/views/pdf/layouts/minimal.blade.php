<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $title ?? 'Document' }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 18px; margin: 0 0 12px 0; }
        h2 { font-size: 13px; margin: 16px 0 8px 0; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        .right { text-align: right; }
        .muted { color: #555; font-size: 10px; }
        .meta { margin-bottom: 16px; }
        .meta td { border: none; padding: 2px 8px 2px 0; }
    </style>
</head>
<body>
@yield('content')
</body>
</html>
