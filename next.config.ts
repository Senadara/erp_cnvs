import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kurangi worker parallel saat build di shared hosting (opsional)
  experimental: {
    webpackBuildWorker: false,
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