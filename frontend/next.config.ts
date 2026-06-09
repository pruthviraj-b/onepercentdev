import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  ...(isGitHubPages && { output: 'export' }),
  ...(isGitHubPages && { basePath: '/onepercentdev' }),
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001', // Local dev backend fallback
  },
};

export default nextConfig;
