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
}

export default nextConfig