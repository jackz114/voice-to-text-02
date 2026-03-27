import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // 确保 drizzle-orm 相关包不被打包到 Workers 中
  // 这些包只在本地 drizzle-kit 迁移时使用
  externals: [
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "drizzle-orm/migrator",
    "drizzle-kit",
    "drizzle-zod",
  ],
});
