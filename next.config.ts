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

  // Turbopack 配置（Next.js 16 默认使用 Turbopack）
  turbopack: {
    resolveAlias: {
      // 为浏览器环境将所有 Node.js 原生模块映射到空文件
      fs: { browser: "./src/lib/empty-polyfill.ts" },
      path: { browser: "./src/lib/empty-polyfill.ts" },
      crypto: { browser: "./src/lib/empty-polyfill.ts" },
      stream: { browser: "./src/lib/empty-polyfill.ts" },
      util: { browser: "./src/lib/empty-polyfill.ts" },
      buffer: { browser: "./src/lib/empty-polyfill.ts" },
      http: { browser: "./src/lib/empty-polyfill.ts" },
      https: { browser: "./src/lib/empty-polyfill.ts" },
      net: { browser: "./src/lib/empty-polyfill.ts" },
      tls: { browser: "./src/lib/empty-polyfill.ts" },
      zlib: { browser: "./src/lib/empty-polyfill.ts" },
      url: { browser: "./src/lib/empty-polyfill.ts" },
      querystring: { browser: "./src/lib/empty-polyfill.ts" },
      os: { browser: "./src/lib/empty-polyfill.ts" },
      punycode: { browser: "./src/lib/empty-polyfill.ts" },
      dgram: { browser: "./src/lib/empty-polyfill.ts" },
      dns: { browser: "./src/lib/empty-polyfill.ts" },
      cluster: { browser: "./src/lib/empty-polyfill.ts" },
      module: { browser: "./src/lib/empty-polyfill.ts" },
      process: { browser: "./src/lib/empty-polyfill.ts" },
      // 明确指定 node: 前缀的模块
      "node:fs": { browser: "./src/lib/empty-polyfill.ts" },
      "node:path": { browser: "./src/lib/empty-polyfill.ts" },
      "node:crypto": { browser: "./src/lib/empty-polyfill.ts" },
      "node:stream": { browser: "./src/lib/empty-polyfill.ts" },
      "node:util": { browser: "./src/lib/empty-polyfill.ts" },
      "node:buffer": { browser: "./src/lib/empty-polyfill.ts" },
      "node:http": { browser: "./src/lib/empty-polyfill.ts" },
      "node:https": { browser: "./src/lib/empty-polyfill.ts" },
      "node:net": { browser: "./src/lib/empty-polyfill.ts" },
      "node:tls": { browser: "./src/lib/empty-polyfill.ts" },
      "node:zlib": { browser: "./src/lib/empty-polyfill.ts" },
      "node:url": { browser: "./src/lib/empty-polyfill.ts" },
      "node:querystring": { browser: "./src/lib/empty-polyfill.ts" },
      "node:os": { browser: "./src/lib/empty-polyfill.ts" },
      "node:punycode": { browser: "./src/lib/empty-polyfill.ts" },
      "node:dgram": { browser: "./src/lib/empty-polyfill.ts" },
      "node:dns": { browser: "./src/lib/empty-polyfill.ts" },
      "node:cluster": { browser: "./src/lib/empty-polyfill.ts" },
      "node:module": { browser: "./src/lib/empty-polyfill.ts" },
      "node:process": { browser: "./src/lib/empty-polyfill.ts" },
    },
  },

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
