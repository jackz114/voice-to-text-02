import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "bijiassistant.shop" },
      { protocol: "https", hostname: "www.bijiassistant.shop" },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // 👇 新增部分：告诉 Webpack 忽略 Node.js 内置模块
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      // 排除所有 node: 前缀的内置模块 (如 node:fs, node:path 等)
      config.externals.push(/^node:/);
    }
    return config;
  },
};

export default nextConfig;