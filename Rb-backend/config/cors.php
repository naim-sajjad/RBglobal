<?php

$configuredOrigins = array_values(array_filter(array_unique(array_merge(
    [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://localhost',
        'http://127.0.0.1',
        rtrim((string) env('FRONTEND_URL', 'http://localhost:3001'), '/'),
        'https://gennextglobaltech.ca',
        'https://www.gennextglobaltech.ca',
        'https://backend.gennextglobaltech.ca',
        'https://randbservicesplus.ca',
        'https://www.randbservicesplus.ca',
    ],
    array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))),
))));

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $configuredOrigins,

    'allowed_origins_patterns' => [
        '#^https://([a-z0-9-]+\.)?gennextglobaltech\.ca$#i',
        '#^https://([a-z0-9-]+\.)?randbservicesplus\.ca$#i',
        '#^http://localhost(:[0-9]+)?$#i',
        '#^http://127\.0\.0\.1(:[0-9]+)?$#i',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => true,

];
