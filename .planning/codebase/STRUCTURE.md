# Codebase Structure

**Analysis Date:** 2026-03-22

## Directory Layout

```
voice-to-txt-02/
├── src/
│   ├── app/                        # Next.js App Router root
│   │   ├── layout.tsx              # Root layout (AuthProvider wrapper)
│   │   ├── page.tsx                # Landing page (/)
│   │   ├── globals.css             # Global styles
│   │   ├── favicon.ico
│   │   ├── login/
│   │   │   └── page.tsx            # Login page (/login)
│   │   ├── payment/
│   │   │   └── page.tsx            # Payment/pricing page (/payment)
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       ├── page.tsx        # OAuth callback page (/auth/callback)
│   │   │       └── AuthCallbackHandler.tsx  # OAuth session finalization
│   │   └── api/
│   │       └── paypal/
│   │           ├── paypal-client.ts             # Shared PayPal API helpers
│   │           ├── create-order/route.ts         # POST /api/paypal/create-order
│   │           ├── capture-order/route.ts        # POST /api/paypal/capture-order
│   │           ├── verify-subscription/route.ts  # POST /api/paypal/verify-subscription
│   │           └── webhook/route.ts              # POST /api/paypal/webhook
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthProvider.tsx     # Global auth context + useAuth hook
│   │   │   ├── GoogleAuthButton.tsx # Google OAuth trigger button
│   │   │   ├── LoginForm.tsx        # Login form wrapper
│   │   │   └── UserNav.tsx          # Nav user avatar/menu
│   │   └── payment/
│   │       └── PayPalButton.tsx     # PayPal checkout button component
│   └── lib/
│       └── supabase.ts              # Supabase singleton client (server-safe)
├── public/                          # Static assets
├── platform_configuration/          # Reference config docs (not deployed)
│   ├── cloudflare/
│   ├── google_cloud/
│   ├── paypal/
│   │   ├── live/
│   │   └── sanbox/
│   └── supabase/
│       └── Authentication/
├── .planning/
│   └── codebase/                    # GSD mapping documents
├── .github/
│   └── workflows/                   # CI/CD pipeline definitions
├── screenshots/                     # UI screenshots (documentation)
├── next.config.ts                   # Next.js configuration
├── wrangler.toml                   # Cloudflare Workers deployment config
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── postcss.config.mjs               # PostCSS configuration
├── eslint.config.mjs                # ESLint configuration
├── package.json                     # Dependencies and scripts
└── business_logic.md                # Business requirements documentation
```

## Directory Purposes

**`src/app/`:**

- Purpose: Next.js App Router pages and API route handlers
- Contains: Page components (`page.tsx`), the root layout, API route files (`route.ts`)
- Key files: `src/app/layout.tsx`, `src/app/page.tsx`

**`src/app/api/paypal/`:**

- Purpose: All server-side PayPal integration endpoints
- Contains: One `route.ts` per operation plus a shared `paypal-client.ts` module
- Key files: `src/app/api/paypal/paypal-client.ts`, `src/app/api/paypal/webhook/route.ts`

**`src/components/`:**

- Purpose: Reusable React components grouped by domain
- Contains: `auth/` for authentication UI and context, `payment/` for PayPal UI
- Key files: `src/components/auth/AuthProvider.tsx`

**`src/lib/`:**

- Purpose: Shared singleton clients and utilities
- Contains: `supabase.ts` — a single exported `supabase` client for use outside of `AuthProvider`
- Key files: `src/lib/supabase.ts`

**`platform_configuration/`:**

- Purpose: Reference documentation and configuration screenshots for external platforms
- Contains: Non-code setup guides for Cloudflare, Google Cloud, PayPal, Supabase
- Generated: No
- Committed: Yes (documentation only, no secrets)

**`.planning/codebase/`:**

- Purpose: GSD codebase mapping documents consumed by plan/execute commands
- Generated: Yes (by `/gsd:map-codebase`)
- Committed: Yes

## Key File Locations

**Entry Points:**

- `src/app/layout.tsx`: Root layout; mounts `AuthProvider` around all pages
- `src/app/page.tsx`: Landing page at `/`
- `src/app/auth/callback/page.tsx`: OAuth redirect landing

**Configuration:**

- `next.config.ts`: Next.js image domains and env var forwarding
- `wrangler.toml`: Cloudflare Workers deployment configuration
- `tsconfig.json`: TypeScript path aliases (`@/` → `src/`)
- `tailwind.config.ts`: Tailwind CSS setup
- `eslint.config.mjs`: ESLint rules

**Core Logic:**

- `src/app/api/paypal/paypal-client.ts`: All PayPal REST API interaction
- `src/components/auth/AuthProvider.tsx`: Auth state management and `useAuth()` hook
- `src/lib/supabase.ts`: Supabase client singleton

**Testing:**

- Not detected — no test files or test framework configuration present

## Naming Conventions

**Files:**

- Pages: `page.tsx` (required by Next.js App Router)
- API routes: `route.ts` (required by Next.js App Router)
- Components: PascalCase, e.g., `AuthProvider.tsx`, `PayPalButton.tsx`
- Utilities/clients: camelCase, e.g., `supabase.ts`, `paypal-client.ts`
- Callback handler co-located with its page: `AuthCallbackHandler.tsx` alongside `page.tsx`

**Directories:**

- App Router segments: kebab-case, e.g., `auth/callback`, `create-order`, `capture-order`
- Component subdirectories: lowercase domain name, e.g., `auth/`, `payment/`

## Where to Add New Code

**New Page:**

- Create `src/app/[route-name]/page.tsx`
- Add `"use client"` directive if the page needs interactivity or hooks

**New API Endpoint:**

- Create `src/app/api/[domain]/[action]/route.ts`
- Export named functions `GET`, `POST`, etc.
- Add shared logic to a `[domain]-client.ts` in the domain folder

**New Reusable Component:**

- Place in `src/components/[domain]/ComponentName.tsx`
- Use PascalCase filename matching the exported component name

**New Shared Utility or SDK Client:**

- Place in `src/lib/[name].ts`
- Export a singleton or named functions

**New Auth-Dependent Component:**

- Import `useAuth` from `src/components/auth/AuthProvider.tsx`
- Ensure component renders inside the `AuthProvider` tree (all pages do by default via layout)

## Special Directories

**`.next/`:**

- Purpose: Next.js build output
- Generated: Yes
- Committed: No

**`.open-next/`:**

- Purpose: OpenNext Cloudflare adapter build output
- Generated: Yes
- Committed: No

**`node_modules/`:**

- Purpose: Installed npm dependencies
- Generated: Yes
- Committed: No

**`platform_configuration/`:**

- Purpose: External platform setup reference docs
- Generated: No
- Committed: Yes

---

_Structure analysis: 2026-03-22_
