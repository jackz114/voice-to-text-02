import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
};

export default withSentryConfig(nextConfig, {
  // Sentry Webpack Plugin 选项
  org: process.env.SENTRY_ORG || "",
  project: process.env.SENTRY_PROJECT || "",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
