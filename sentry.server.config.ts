// Cloudflare Workers 需要使用 @sentry/cloudflare
import * as Sentry from "@sentry/cloudflare";

// 扩展 Cloudflare Pages 环境变量类型
type Env = {
  SENTRY_DSN?: string;
  NODE_ENV?: string;
};

export const onRequest = Sentry.sentryPagesPlugin((context) => {
  const env = context.env as Env;

  return {
    dsn: env.SENTRY_DSN || process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    enabled: (env.NODE_ENV || process.env.NODE_ENV) === "production",
  };
});
