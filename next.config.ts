import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  // 图片域名配置（Supabase Storage 等）
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "bijiassistant.shop",
      },
      {
        protocol: "https",
        hostname: "www.bijiassistant.shop",
      },
    ],
  },

  // 环境变量（客户端可用）
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // 输出配置（Cloudflare Workers 适配器会自动处理）
  // output: "standalone",

  // 优化包导入，减少冷启动时间
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // Webpack 配置：消除 Next.js 内部调试代码中对 Node.js 内置模块的引用
  // Cloudflare Workers 不支持 node:fs 等内置模块，需要重定向到空模块
  webpack: (config, { isServer }) => {
    // 1. 通过 DefinePlugin 禁用调试代码路径
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.NEXT_DEBUG_IMMEDIATES": JSON.stringify("0"),
      })
    );

    // 2. 重定向 Node.js 内置模块到空模块（解决静态分析报错）
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "node:fs": "@/lib/empty-module.ts",
      "node:util": "@/lib/empty-module.ts",
      "node:path": "@/lib/empty-module.ts",
      "node:stream": "@/lib/empty-module.ts",
      "node:crypto": "@/lib/empty-module.ts",
      "node:buffer": "@/lib/empty-module.ts",
    };

    return config;
  },
};

export default nextConfig;
