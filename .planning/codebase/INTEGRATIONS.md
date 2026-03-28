# External Integrations

**Analysis Date:** 2026-03-22

## APIs & External Services

**Payment Processing:**

- PayPal REST API - One-time order payments and recurring subscriptions
  - SDK/Client: `@paypal/react-paypal-js` (frontend), native `fetch` (backend API routes)
  - Backend client: `src/app/api/paypal/paypal-client.ts`
  - Auth: OAuth 2.0 client credentials flow (`NEXT_PUBLIC_PAYPAL_CLIENT_ID` + `PAYPAL_CLIENT_SECRET`)
  - API base: `PAYPAL_API_URL` env var (defaults to `https://api-m.sandbox.paypal.com`)
  - Endpoints used:
    - `POST /v1/oauth2/token` - Access token retrieval
    - `POST /v2/checkout/orders` - Order creation
    - `GET /v2/checkout/orders/:id` - Order details
    - `POST /v2/checkout/orders/:id/capture` - Payment capture
    - `GET /v1/billing/subscriptions/:id` - Subscription details
    - `POST /v1/notifications/verify-webhook-signature` - Webhook verification

**Bot Protection:**

- Cloudflare Turnstile - CAPTCHA for registration flow
  - SDK/Client: `react-turnstile` 1.1.5
  - Used in: `src/components/auth/LoginForm.tsx` (registration mode only)
  - Sitekey: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (currently hardcoded test key `1x00000000000000000000AA` in code)
  - Token passed to Supabase auth `captchaToken` on `signUp`

**Fonts:**

- Google Fonts (via Next.js font optimization) - Geist Sans and Geist Mono
  - Loaded in: `src/app/layout.tsx`

## Data Storage

**Databases:**

- Supabase (PostgreSQL) - Primary database and auth provider
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` (public), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
  - Client library: `@supabase/supabase-js` 2.99.3
  - ORM layer: `drizzle-orm` 0.45.1 with `drizzle-kit` for migrations (schema files not yet present in explored source)
  - Client initialized in: `src/lib/supabase.ts` (shared singleton), also instantiated inline in several auth components

**File Storage:**

- Supabase Storage - Referenced in `next.config.ts` remote image pattern `*.supabase.co`
  - No direct storage SDK calls found in explored source

**Caching:**

- None detected (no Redis, KV, or in-memory cache layer found)

## Authentication & Identity

**Auth Provider:**

- Supabase Auth - Handles all authentication flows
  - Implementation: `src/components/auth/AuthProvider.tsx` (React Context + session listener)
  - Callback handler: `src/app/auth/callback/AuthCallbackHandler.tsx`
  - Auth state exposed globally via `useAuth()` hook from `AuthProvider`

**Login Methods:**

- Google OAuth - `supabase.auth.signInWithOAuth({ provider: "google" })` in `src/components/auth/GoogleAuthButton.tsx`
  - Redirect URI: `{origin}/auth/callback?redirect_to={destination}`
- Email/password - `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()` in `src/components/auth/LoginForm.tsx`
  - Registration requires Turnstile CAPTCHA token

**Session Management:**

- Supabase session cookies (managed by SDK)
- `supabase.auth.onAuthStateChange()` listener keeps React state synchronized
- `supabase.auth.exchangeCodeForSession()` called in OAuth callback to complete PKCE flow

## Monitoring & Observability

**Cloudflare Observability:**

- Enabled in `wrangler.toml` (`observability.enabled: true`, `head_sampling_rate: 1`)
- Captures 100% of requests at the Cloudflare Workers layer

**Error Tracking:**

- None detected (no Sentry, Datadog, or equivalent SDK found)

**Logs:**

- `console.log` / `console.error` throughout API routes
- Cloudflare Workers captures these via `wrangler tail` (`npm run cf:logs`)

## CI/CD & Deployment

**Hosting:**

- Cloudflare Workers via OpenNext adapter (`@opennextjs/cloudflare`)
- Production domain: `bijiassistant.shop` (custom domain in `wrangler.toml`)

**Build Pipeline:**

- `npm run build:cloudflare` - Runs `opennextjs-cloudflare build` (produces `.open-next/worker.js`)
- `npm run deploy` - Build + deploy to production
- `npm run deploy:staging` - Build + deploy with `--env staging` flag

**CI Pipeline:**

- Not detected (no GitHub Actions, CircleCI, or equivalent config found)

**Secrets Management:**

- Cloudflare Workers secrets via `wrangler secret put` (`npm run cf:secret:put`)
- Local development: `.env.local` file
- Platform configuration docs in `platform_configuration/` subdirectories: `cloudflare/`, `supabase/`, `paypal/`, `google_cloud/`

## Webhooks & Callbacks

**Incoming Webhooks:**

- PayPal Webhook endpoint: `POST /api/paypal/webhook` (`src/app/api/paypal/webhook/route.ts`)
  - Signature verification via PayPal API (`PAYPAL_WEBHOOK_ID` env var required)
  - Handles events:
    - `CHECKOUT.ORDER.APPROVED`
    - `CHECKOUT.ORDER.COMPLETED`
    - `PAYMENT.CAPTURE.COMPLETED`
    - `BILLING.SUBSCRIPTION.CREATED`
    - `BILLING.SUBSCRIPTION.ACTIVATED`
    - `BILLING.SUBSCRIPTION.CANCELLED`
    - `BILLING.SUBSCRIPTION.EXPIRED`
    - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
  - Note: Database persistence calls are stubbed (commented out) - webhook handlers log only

**OAuth Callbacks:**

- Supabase OAuth callback: `GET /auth/callback` (`src/app/auth/callback/page.tsx` + `AuthCallbackHandler.tsx`)
  - Exchanges OAuth code for session via `supabase.auth.exchangeCodeForSession()`

**Outgoing Webhooks:**

- None detected

## Environment Configuration

**Required public env vars (exposed to browser):**

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` - PayPal app client ID
- `NEXT_PUBLIC_APP_URL` - Canonical app URL (e.g. `https://bijiassistant.shop`)
- `NEXT_PUBLIC_PAYPAL_PLAN_ID` - PayPal subscription plan ID (optional; hides subscription UI if absent)

**Required secret env vars (server-only):**

- `PAYPAL_CLIENT_SECRET` - PayPal app secret for server-side token exchange
- `PAYPAL_WEBHOOK_ID` - PayPal webhook ID for signature verification
- `PAYPAL_API_URL` - PayPal API base URL (defaults to sandbox; override for production)

---

_Integration audit: 2026-03-22_
