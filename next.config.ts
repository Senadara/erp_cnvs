import type { NextConfig } from "next";

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    webpackBuildWorker: false,
    // Server Actions di belakang proxy cPanel (subdomain)
    ...(allowedOrigins?.length
      ? { serverActions: { allowedOrigins } }
      : {}),
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;