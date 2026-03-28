// Cloudflare Workers 需要使用 @sentry/cloudflare
import * as Sentry from "@sentry/cloudflare";

export const onRequest = Sentry.sentryPagesPlugin((context) => ({
  dsn: context.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  enabled: context.env.NODE_ENV === "production",
}));
