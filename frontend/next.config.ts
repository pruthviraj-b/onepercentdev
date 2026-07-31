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
    NEXT_PUBLIC_API_URL: 'http://localhost:3001', // Local dev backend fallback
    NEXT_PUBLIC_GITHUB_PAGES: isGitHubPages ? 'true' : 'false',
  },
};

export default nextConfig;
