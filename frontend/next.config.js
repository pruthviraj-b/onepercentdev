/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001',
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;

