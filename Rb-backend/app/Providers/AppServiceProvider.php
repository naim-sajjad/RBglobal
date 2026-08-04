<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('contact-submissions', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
        ]);

        RateLimiter::for('newsletter-subscriptions', fn (Request $request) => [
            Limit::perMinute(10)->by($request->ip()),
        ]);

        RateLimiter::for('admin-login', fn (Request $request) => [
            Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip()),
        ]);

        RateLimiter::for('contact-imports', fn (Request $request) => [
            Limit::perMinute(10)->by((string) ($request->user()?->id ?? $request->ip())),
        ]);

        RateLimiter::for('newsletter-imports', fn (Request $request) => [
            Limit::perMinute(10)->by((string) ($request->user()?->id ?? $request->ip())),
        ]);

        RateLimiter::for('job-applications', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
        ]);

        RateLimiter::for('career-growth-registrations', fn (Request $request) => [
            Limit::perMinute(5)->by($request->ip()),
        ]);
    }
}
