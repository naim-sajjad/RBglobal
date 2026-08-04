<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Models\ContactSubmission;
use App\Models\JobPost;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardStatsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $recentEntries = ContactSubmission::query()
            ->latestSubmissions()
            ->limit(5)
            ->get();

        return response()->json([
            'total_contacts' => ContactSubmission::count(),
            'unread_contacts' => ContactSubmission::unread()->count(),
            'total_active_subscribers' => NewsletterSubscriber::active()->count(),
            'total_subscribers' => NewsletterSubscriber::count(),
            'total_blog_posts' => BlogPost::count(),
            'total_blogs' => BlogPost::count(),
            'published_posts' => BlogPost::where('status', BlogPost::STATUS_PUBLISHED)->count(),
            'draft_posts' => BlogPost::where('status', BlogPost::STATUS_DRAFT)->count(),
            'total_jobs' => JobPost::count(),
            'published_jobs' => JobPost::where('status', JobPost::STATUS_PUBLISHED)->count(),
            'draft_jobs' => JobPost::where('status', JobPost::STATUS_DRAFT)->count(),
            'total_admin_users' => $request->user()->isSuperAdmin() ? User::count() : null,
            'recent_entries' => $recentEntries,
        ]);
    }
}
