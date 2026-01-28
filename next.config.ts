import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright와 호환을 위해 webpack 사용
  experimental: {
    // @ts-ignore
    turbo: false,
  },
};

export default nextConfig;
