import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // 排除 drizzle-orm 和相关模块，避免打包 node:fs 等 Node.js 内置模块
  externals: [
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "drizzle-orm/migrator",
    "drizzle-kit",
  ],
});
