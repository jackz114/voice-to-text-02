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
      // 修复：强制获取 default 属性，兼容 ESM/CJS 混合情况
      // @ts-ignore
      const NodePolyfillPlugin = require("node-polyfill-webpack-plugin").default; 
      
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