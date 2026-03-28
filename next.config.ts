// next.config.ts
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

  // 关键配置：排除已知的服务端依赖，不让它们被打包到客户端
  serverExternalPackages: [
    "@sentry/nextjs",
    "@sentry/cloudflare",
    "openai",
    "resend",
    "@react-email/components",
  ],

  webpack: (config, { isServer }) => {
    // 为所有环境（客户端和服务端）都添加 fallback
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      http: false,
      https: false,
      net: false,
      tls: false,
      zlib: false,
      url: false,
      querystring: false,
      os: false,
      punycode: false,
      dgram: false,
      dns: false,
      cluster: false,
      module: false,
      process: false,
      "node:fs": false,
      "node:path": false,
      "node:crypto": false,
      "node:stream": false,
      "node:util": false,
      "node:buffer": false,
      "node:http": false,
      "node:https": false,
      "node:net": false,
      "node:tls": false,
      "node:zlib": false,
      "node:url": false,
      "node:querystring": false,
      "node:os": false,
      "node:punycode": false,
    };

    // 确保这些模块不会被打包进客户端
    if (!isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push(
          /^node:/,
          "fs",
          "path",
          "crypto",
          "stream",
          "util",
          "buffer",
          "http",
          "https",
          "net",
          "tls",
          "zlib",
          "url",
          "querystring",
          "os",
          "punycode",
          "dgram",
          "dns",
          "cluster",
          "module"
        );
      }
    }

    return config;
  },
};

export default nextConfig;
