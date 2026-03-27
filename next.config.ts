import type { NextConfig } from "next";
// 1. 引入 Polyfill 插件
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";

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
    // 2. 配置 Polyfill
    if (!config.resolve) config.resolve = {};
    if (!config.resolve.plugins) config.resolve.plugins = [];

    // 添加 Node.js Polyfill 插件
    // 这会自动处理 fs, path, crypto 等常见模块
    config.resolve.plugins.push(new NodePolyfillPlugin());

    // 3. 额外保险：如果插件没覆盖到，手动 fallback
    if (!config.resolve.fallback) config.resolve.fallback = {};
    config.resolve.fallback.fs = false; // 或者 require.resolve("browserify-fs") 如果你需要读写模拟文件系统
    config.resolve.fallback.path = false;
    config.resolve.fallback.crypto = false;

    return config;
  },
};

export default nextConfig;
