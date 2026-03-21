import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    // Cloudflare 适配器配置
    override: {
      // 使用 Cloudflare Workers 包装器
      wrapper: "cloudflare-node",
      // 增量静态再生成（ISR）配置
      incrementalCache: "cloudflare-kv",
      // 标签缓存
      tagCache: "cloudflare-kv",
      // 队列配置（用于 ISR 后台更新）
      queue: "cloudflare-queue",
    },
  },

  // 中间件配置
  middleware: {
    external: true,
  },

  // 构建配置
  buildOutputPath: ".open-next",
};

export default config;
