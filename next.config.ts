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
      // 强制兼容所有版本的引入方式
      // @ts-ignore
      const plugin = require("node-polyfill-webpack-plugin");
      // 不管它是 default 还是 module.exports，直接把函数本体拿出来
      const NodePolyfillPlugin = plugin.default || plugin;

      if (!config.resolve) config.resolve = {};
      if (!config.resolve.plugins) config.resolve.plugins = [];

      config.resolve.plugins.push(
        new NodePolyfillPlugin({
          excludeAliases: ["console"],
        })
      );
    }
    return config;
  },
};

export default nextConfig;