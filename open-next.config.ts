import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  experimental: {
    // 启用 Node.js 兼容性，这是解决 node:fs 等模块问题的关键
    nodejsCompat: true,
  },
});
