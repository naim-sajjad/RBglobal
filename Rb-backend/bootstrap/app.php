<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API clients must receive a 401 response; never redirect them to a
        // browser-only named login route.
        $middleware->redirectGuestsTo(
            fn (\Illuminate\Http\Request $request) => $request->is('api/*') ? null : '/login'
        );

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // Public website forms are bearer/token API posts from the Next.js site,
        // not cookie-authenticated Sanctum SPA requests.
        $middleware->validateCsrfTokens(except: [
            'api/contact-submissions',
            'api/newsletter-subscriptions',
            'api/job-applications',
            'api/career-growth-registrations',
            'api/v1/contact-submissions',
            'api/v1/newsletter-subscriptions',
            'api/v1/job-applications',
            'api/v1/career-growth-registrations',
        ]);

        // Register Spatie Permission middleware aliases
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
