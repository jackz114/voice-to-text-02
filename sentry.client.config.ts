import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 调整采样率
  tracesSampleRate: 1.0,
  // 开发环境不发送
  enabled: process.env.NODE_ENV === "production",
  // Cloudflare Workers 支持
  integrations: [],
});
