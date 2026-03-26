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

  // Webpack 配置：消除 Next.js 内部调试代码中对 node:fs 的引用
  // 这段代码仅在 NEXT_DEBUG_IMMEDIATES=1 时执行，但 Cloudflare Workers 会静态分析报错
  webpack: (config, { isServer }) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.NEXT_DEBUG_IMMEDIATES": JSON.stringify("0"),
      })
    );
    return config;
  },
};

export default nextConfig;
