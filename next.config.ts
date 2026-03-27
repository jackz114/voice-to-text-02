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
  webpack: (config, { isServer }) => {
    // 关键修复：仅在服务器端构建时动态加载插件
    if (isServer) {
      // @ts-ignore
      const NodePolyfillPlugin = require("node-polyfill-webpack-plugin").default;
      if (!config.resolve) config.resolve = {};
      if (!config.resolve.plugins) config.resolve.plugins = [];
      config.resolve.plugins.push(
        new NodePolyfillPlugin({
          excludeAliases: ["console"], // 排除 console 避免冲突
        })
      );
    }
    return config;
  },
};

export default nextConfig;