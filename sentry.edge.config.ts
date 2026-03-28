import * as Sentry from "@sentry/cloudflare";

export const onRequest = Sentry.sentryPagesPlugin(() => ({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  enabled: process.env.NODE_ENV === "production",
}));
