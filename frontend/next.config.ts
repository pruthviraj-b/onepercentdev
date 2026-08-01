import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  ...(isGitHubPages && { output: 'export' }),
  ...(isGitHubPages && { basePath: '/onepercentdev' }),
  transpilePackages: ['react-markdown', 'rehype-raw', 'remark-gfm', 'rehype-sanitize'],
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Run static generation in-process to inherit NODE_OPTIONS memory limit
    workerThreads: false,
    cpus: 1,
  },
  env: {
    // On Vercel, API calls are same-origin (/api/* rewrites to the backend service).
    // Locally, the Express server runs on port 3001.
    NEXT_PUBLIC_API_URL: process.env.VERCEL ? '' : 'http://localhost:3001',
    NEXT_PUBLIC_GITHUB_PAGES: isGitHubPages ? 'true' : 'false',
  },
};

export default nextConfig;
