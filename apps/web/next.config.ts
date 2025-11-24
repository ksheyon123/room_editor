import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Three.js 관련 설정
    config.externals = config.externals || [];
    config.externals.push({
      canvas: "canvas",
    });

    return config;
  },
};

export default nextConfig;
