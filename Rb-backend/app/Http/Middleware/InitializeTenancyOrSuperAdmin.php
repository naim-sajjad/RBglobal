<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Stancl\Tenancy\Middleware\InitializeTenancyByRequestData;
use Stancl\Tenancy\Tenancy;
use Stancl\Tenancy\Resolvers\RequestDataTenantResolver;

class InitializeTenancyOrSuperAdmin
{
    protected $tenancy;
    protected $resolver;

    public function __construct(Tenancy $tenancy, RequestDataTenantResolver $resolver)
    {
        $this->tenancy = $tenancy;
        $this->resolver = $resolver;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If user is super admin, skip tenant initialization (they can access without tenant context)
        // But if they provide X-Tenant header, we can still initialize it for filtering
        if ($user && $user->is_global_admin) {
            // Check if X-Tenant header is provided - if so, initialize tenant for filtering
            if ($request->hasHeader('X-Tenant') || $request->has('tenant')) {
                // Initialize tenant if provided (for filtering purposes)
                $tenantMiddleware = new InitializeTenancyByRequestData($this->tenancy, $this->resolver);
                try {
                    return $tenantMiddleware->handle($request, $next);
                } catch (\Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedByRequestDataException $e) {
                    // If tenant can't be identified, continue without tenant (super admin can see all)
                    return $next($request);
                }
            }
            // No tenant header - super admin can access without tenant context
            return $next($request);
        }

        // For non-super-admin users, require tenant context
        $tenantMiddleware = new InitializeTenancyByRequestData($this->tenancy, $this->resolver);
        return $tenantMiddleware->handle($request, $next);
    }
}

