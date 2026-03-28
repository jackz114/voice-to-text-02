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

  // Cloudflare Workers 的 webpack 配置
  webpack: (config, { isServer, nextRuntime }) => {
    // 只对 Edge Runtime (Cloudflare Workers) 应用这些配置
    if (isServer && nextRuntime === "edge") {
      // 提供 node:timers 的 polyfill
      // 在 Workers 环境中使用全局的 setInterval/clearInterval/setTimeout/clearTimeout
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:timers": false,
        timers: false,
      };

      // 或者尝试使用 fallback
      config.resolve.fallback = {
        ...config.resolve.fallback,
        timers: false,
        "node:timers": false,
      };
    }

    return config;
  },
};

export default nextConfig;
