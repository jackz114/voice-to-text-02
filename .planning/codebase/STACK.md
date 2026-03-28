# Technology Stack

**Analysis Date:** 2026-03-22

## Languages

**Primary:**

- TypeScript 5.x - All source files under `src/`, config files (`next.config.ts`, `tailwind.config.ts`, `eslint.config.mjs`)

**Secondary:**

- CSS - Global styles at `src/app/globals.css` (Tailwind utility classes)

## Runtime

**Environment:**

- Node.js 22.22.1 (detected via `node --version`)

**Package Manager:**

- npm
- Lockfile: `package-lock.json` (lockfileVersion 3) - present and committed

## Frameworks

**Core:**

- Next.js 16.2.0 - Full-stack React framework; App Router pattern used throughout `src/app/`
- React 19.2.4 - UI library; React DOM 19.2.4

**Styling:**

- Tailwind CSS 4.x - Utility-first CSS; configured in `tailwind.config.ts`, PostCSS via `postcss.config.mjs`
- `@tailwindcss/postcss` 4.x - PostCSS integration for Tailwind v4

**State Management:**

- Zustand 5.0.12 - Client-side global state (declared dependency, usage not yet found in explored source)
- React Context API - Auth state via `src/components/auth/AuthProvider.tsx`

**Forms:**

- react-hook-form 7.71.2 - Form management (declared dependency)
- Zod 4.3.6 - Schema validation (declared dependency, used for API input validation)

**Build/Dev:**

- `@opennextjs/cloudflare` 1.17.1 - Adapts Next.js for Cloudflare Workers deployment
- Wrangler 4.76.0 - Cloudflare Workers CLI for dev, deploy, secrets, and logs
- ESLint 9.x - Linting with flat config (`eslint.config.mjs`)
- `eslint-config-next` 16.2.0 - Next.js-specific ESLint rules
- `eslint-config-prettier` 10.1.8 - Disables ESLint rules that conflict with Prettier
- drizzle-kit 0.31.10 - Database migration CLI (dev dependency)

## Key Dependencies

**Critical:**

- `@supabase/supabase-js` 2.99.3 - Database client and auth SDK; used in `src/lib/supabase.ts`, `src/components/auth/AuthProvider.tsx`, `src/components/auth/LoginForm.tsx`, `src/components/auth/GoogleAuthButton.tsx`, `src/app/auth/callback/AuthCallbackHandler.tsx`
- `@paypal/react-paypal-js` 9.0.2 - PayPal React SDK; used in `src/components/payment/PayPalButton.tsx`
- `drizzle-orm` 0.45.1 - ORM for database schema and queries (declared; no schema files found in explored source)
- `react-turnstile` 1.1.5 - Cloudflare Turnstile CAPTCHA widget; used in `src/components/auth/LoginForm.tsx`

**UI Utilities:**

- `@radix-ui/react-slot` 1.2.4 - Primitive slot component for composable UI
- `class-variance-authority` 0.7.1 - Variant-based className management
- `clsx` 2.1.1 - Conditional className merging
- `tailwind-merge` 3.5.0 - Merges conflicting Tailwind classes

**Typography:**

- Geist Sans and Geist Mono - Google Fonts loaded via Next.js font optimization in `src/app/layout.tsx`

## Configuration

**TypeScript:**

- `tsconfig.json` - `strict: true`, target `ES2017`, `@/*` path alias mapping to `./src/*`
- Module resolution: `bundler` mode

**Next.js:**

- `next.config.ts` - Remote image patterns for `*.supabase.co` and `bijiassistant.shop`; exposes `NEXT_PUBLIC_APP_URL`

**Tailwind:**

- `tailwind.config.ts` - Content scoped to `src/app/**` and `src/components/**`

**Cloudflare:**

- `wrangler.toml` - Worker named `voice-to-text-02`, entry `".open-next/worker.js"`, compatibility date `2026-03-21`, `nodejs_compat_v2` flag, custom domain `bijiassistant.shop/*`, observability enabled

**Environment:**

- `.env` and `.env.local` files present (contents not read)
- Required public vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_PAYPAL_PLAN_ID`
- Required secret vars: `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_API_URL`

**Linting:**

- `eslint.config.mjs` - ESLint v9 flat config; TypeScript + React + Hooks + Prettier compatibility; `no-console: off`

## Platform Requirements

**Development:**

- Node.js 22.x
- `npm run dev` - Next.js dev server
- `npm run cf:dev` - Wrangler local dev (Cloudflare Workers emulation)

**Production:**

- Cloudflare Workers via OpenNext adapter
- `npm run deploy` - Builds with `opennextjs-cloudflare` then deploys via Wrangler
- `npm run deploy:staging` - Same but targets staging environment
- Custom domain: `bijiassistant.shop`

---

_Stack analysis: 2026-03-22_
