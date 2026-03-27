// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// 使用 defineCloudflareConfig 生成基础配置
// 然后展开并覆盖 edgeExternals 以添加 drizzle-orm 等排除项
const baseConfig = defineCloudflareConfig({
  // 使用 dummy 缓存（不需要额外绑定）
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "dummy",
});

// 导出完整配置，覆盖 edgeExternals
export default {
  ...baseConfig,
  edgeExternals: [
    // Node.js 内置模块（Cloudflare Workers 不支持）
    "node:crypto",
    "node:fs",
    "node:path",
    "node:util",
    "node:stream",
    "node:buffer",
    // Drizzle ORM 相关（内部引用 node:fs）
    "drizzle-orm",
    "drizzle-orm/pg-core",
    "drizzle-orm/migrator",
    "drizzle-kit",
    "drizzle-zod",
  ],
};
