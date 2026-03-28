import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // 调整采样率
  tracesSampleRate: 1.0,

  // 开发环境不发送
  enabled: process.env.NODE_ENV === "production",

  // Cloudflare Workers 支持
  // @ts-ignore
  integrations: [],
});
