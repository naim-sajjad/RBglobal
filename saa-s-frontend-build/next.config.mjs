/** @type {import('next').NextConfig} */
const nextConfig = {
  //output: 'export', // Static export for shared hosting
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable features that require server-side rendering
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: '/admin/employers',
        destination: '/admin/customers',
        permanent: true,
      },
      {
        source: '/admin/employers/:path*',
        destination: '/admin/customers/:path*',
        permanent: true,
      },
    ];
  },
}

export default nextConfig