import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <p className="text-slate-400">Page not found</p>
        </div>

        <p className="text-slate-300 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <Link href="/dashboard">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
