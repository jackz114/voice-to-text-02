import type { NextConfig } from "next";

// ⚠️ 注意：不要在这里直接 import NodePolyfillPlugin
// 因为在 Server Components / Edge Runtime 环境下，某些 Node API 可能不可用
// 我们将在 webpack 函数内部动态 require

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
    // 1. 仅在构建服务器端代码时执行（避免 Edge Runtime 报错）
    if (isServer) {
      // 2. 动态引入插件，防止 OpenNext 构建时顶层报错
      // @ts-ignore - 忽略动态导入的类型检查
      const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

      // 3. 初始化插件
      const plugin = new NodePolyfillPlugin({
        // 明确指定需要 polyfill 的模块
        excludeAliases: ["console"],
      });

      // 4. 检查 resolve.plugins 是否已存在，否则初始化
      if (!config.resolve) config.resolve = {};
      if (!config.resolve.plugins) config.resolve.plugins = [];

      // 5. 将插件推入 resolve.plugins 数组
      config.resolve.plugins.push(plugin);
    }

    return config;
  },
};

export default nextConfig;