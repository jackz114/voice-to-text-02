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
  webpack: (config, { isServer }) => {
    // 为所有环境（客户端和服务端）都添加 fallback
    // 这是关键修改点，确保在构建服务端代码时也严格替换掉 fs 相关模块
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
      "node:fs": false, // 明确指定 node:fs
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

    // 如果是服务端构建，还可以考虑将这些模块标记为外部依赖，不让它们被打包
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push(
        'fs', 'path', 'crypto', 'stream', 'util', 'buffer',
        'http', 'https', 'net', 'tls', 'zlib', 'url', 'querystring',
        'os', 'punycode', 'dgram', 'dns', 'cluster', 'module', 'process',
        'node:fs', 'node:path', 'node:crypto', 'node:stream', 'node:util',
        'node:buffer', 'node:http', 'node:https', 'node:net', 'node:tls',
        'node:zlib', 'node:url', 'node:querystring', 'node:os', 'node:punycode'
      );
    }

    return config;
  },
};

export default nextConfig;