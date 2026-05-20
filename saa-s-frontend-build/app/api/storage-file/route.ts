import { readFile } from 'fs/promises';
import nodePath from 'path';
import { NextRequest } from 'next/server';

/** Derive Laravel public origin from the same env the client uses for the API */
function laravelOrigin(): string {
  const apiBase =
    process.env.STORAGE_BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost/api/v1';
  return apiBase.replace(/\/api\/v1\/?$/i, '').replace(/\/$/, '') || '';
}

function isAllowedPublicStoragePath(path: string): boolean {
  if (!path || path.includes('..') || path.startsWith('/')) {
    return false;
  }
  if (!/^drivers\/[a-zA-Z0-9_\-.\/]+$/.test(path)) {
    return false;
  }
  const ext = (path.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext);
}

function contentTypeForPath(path: string): string {
  const ext = (path.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return types[ext] || 'application/octet-stream';
}

function localPublicStorageRoot(): string {
  return nodePath.resolve(
    process.env.STORAGE_PUBLIC_ROOT ||
      nodePath.join(process.cwd(), '..', 'Rb-backend', 'storage', 'app', 'public'),
  );
}

function safeLocalStoragePath(root: string, relativePath: string): string | null {
  const resolved = nodePath.resolve(root, relativePath);
  const rootWithSep = root.endsWith(nodePath.sep) ? root : root + nodePath.sep;
  return resolved === root || resolved.startsWith(rootWithSep) ? resolved : null;
}

/**
 * Fetch a file from Laravel's `/storage/{path}` on the server (no browser CORS).
 * Admin PDF export loads licence images via this route as same-origin.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('path');
  const path = (raw ?? '').replace(/^\/+/, '').trim();
  if (!isAllowedPublicStoragePath(path)) {
    return new Response('Invalid path', { status: 400 });
  }

  const origin = laravelOrigin();
  if (!origin) {
    return new Response('Misconfigured STORAGE_BACKEND_ORIGIN / NEXT_PUBLIC_API_URL', {
      status: 500,
    });
  }

  const segments = path.split('/').map((p) => encodeURIComponent(p));
  const localRoot = localPublicStorageRoot();
  const localPath = safeLocalStoragePath(localRoot, path);
  if (localPath) {
    try {
      const buf = await readFile(localPath);
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': contentTypeForPath(path),
          'Cache-Control': 'private, max-age=60',
        },
      });
    } catch {
      /* Fall back to Laravel HTTP storage URL below. */
    }
  }

  const target = `${origin}/storage/${segments.join('/')}`;
  try {
    const upstream = await fetch(target, {
      redirect: 'follow',
      cache: 'no-store',
      headers: { Accept: 'image/*,*/*' },
    });
    if (!upstream.ok) {
      return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
    }
    const ct =
      upstream.headers.get('content-type') || 'application/octet-stream';
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch {
    return new Response('Upstream error', { status: 502 });
  }
}
