import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {},
  // 确保 drizzle-orm 相关包不被打包到 Workers 中
  // 这些包只在本地 drizzle-kit 迁移时使用
  edgeExternals: [
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "drizzle-orm/migrator",
    "drizzle-kit",
    "drizzle-zod",
  ],
  cloudflare: {
    // Cloudflare 特定配置
  },
};

export default config;
