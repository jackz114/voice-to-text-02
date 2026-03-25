// Cloudflare Workers 运行时类型声明
// 此文件为 OpenNext.js Cloudflare 构建提供 R2 绑定类型

declare global {
  /** R2 音频存储桶绑定 - 在 wrangler.jsonc 中定义 */
  const AUDIO_BUCKET: import("@cloudflare/workers-types").R2Bucket;
}

export {};
