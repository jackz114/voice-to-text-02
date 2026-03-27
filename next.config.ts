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
    if (isServer) {
      // 使用原生 fallback 配置，替代插件
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
    }
    return config;
  },
};

export default nextConfig;