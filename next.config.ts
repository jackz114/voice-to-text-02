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
  serverExternalPackages: [
    "openai",
    "resend",
    "@react-email/components",
  ],

  // 删除了 webpack 配置
  // Cloudflare Workers 需要依赖 nodejs_compat 来处理 fs/path 等模块，
  // 不需要手动 fallback 或 external 为 false
};

export default nextConfig;
