import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关键修复：正确处理 webpack externals
  webpack: (config, { isServer }) => {
    // 仅在构建 Server 端代码时生效 (Cloudflare Workers 就是 Server 端)
    if (isServer) {
      // 1. 确保 externals 数组存在 (修复 Cannot read properties of undefined 错误)
      if (!config.externals) {
        config.externals = [];
      }

      // 2. 强制将 Node.js 原生模块视为外部依赖
      // 这样打包器就不会把 fs 的代码塞进 worker.js，而是依赖 Cloudflare 的 nodejs_compat 运行时
      config.externals.push(
        "fs",
        "vm",
        "node:fs",
        "path",
        "node:path",
        "os",
        "node:os",
        "crypto",
        "node:crypto",
        "stream",
        "node:stream",
        "buffer",
        "node:buffer",
        "zlib",
        "node:zlib"
      );
    }
    return config;
  },
};

export default nextConfig;
