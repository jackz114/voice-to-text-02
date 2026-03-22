# Architecture

**Analysis Date:** 2026-03-22

## Pattern Overview

**Overall:** Next.js App Router with server-side API routes and client-side React context for state

**Key Characteristics:**
- File-system based routing via Next.js App Router (`src/app/`)
- Client components use React Context for auth state propagation
- API routes are thin controllers delegating to a shared client module
- Deployed to Cloudflare Workers via `@opennextjs/cloudflare` adapter

## Layers

**UI Pages (Client):**
- Purpose: Render user-facing pages, trigger user interactions
- Location: `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/payment/page.tsx`, `src/app/auth/callback/page.tsx`
- Contains: React Server/Client components, page-level layout
- Depends on: Components layer, AuthProvider context
- Used by: End users via browser

**Components (Client):**
- Purpose: Reusable UI and logic components grouped by domain
- Location: `src/components/auth/`, `src/components/payment/`
- Contains: `AuthProvider.tsx`, `GoogleAuthButton.tsx`, `LoginForm.tsx`, `UserNav.tsx`, `PayPalButton.tsx`
- Depends on: `src/lib/supabase.ts`, React Context
- Used by: Pages layer

**API Routes (Server):**
- Purpose: Server-side endpoints handling payment operations with PayPal
- Location: `src/app/api/paypal/`
- Contains: `create-order/route.ts`, `capture-order/route.ts`, `verify-subscription/route.ts`, `webhook/route.ts`
- Depends on: `src/app/api/paypal/paypal-client.ts`
- Used by: Client components and external PayPal webhook calls

**Shared Client / SDK Wrappers:**
- Purpose: Centralized SDK initialization and typed helper functions
- Location: `src/app/api/paypal/paypal-client.ts`, `src/lib/supabase.ts`
- Contains: PayPal REST API helpers (`getPayPalAccessToken`, `createPayPalOrder`, `capturePayPalOrder`, `getSubscriptionDetails`), Supabase singleton client
- Depends on: Environment variables
- Used by: API routes, AuthProvider

## Data Flow

**Authentication Flow:**

1. User visits `/login` and clicks Google Sign-In (`src/app/login/page.tsx` → `src/components/auth/GoogleAuthButton.tsx`)
2. Supabase OAuth redirect sends user to `/auth/callback`
3. `src/app/auth/callback/AuthCallbackHandler.tsx` exchanges code for session via Supabase
4. `AuthProvider` (`src/components/auth/AuthProvider.tsx`) picks up session change via `onAuthStateChange` and updates global `user` state
5. All pages access `user` via `useAuth()` hook

**Payment Flow (One-time Purchase):**

1. User visits `/payment` and initiates PayPal checkout (`src/components/payment/PayPalButton.tsx`)
2. Client calls `POST /api/paypal/create-order` → `paypal-client.ts:createPayPalOrder()` → PayPal API
3. PayPal redirects user back; client calls `POST /api/paypal/capture-order` → `paypal-client.ts:capturePayPalOrder()`
4. PayPal sends async confirmation to `POST /api/paypal/webhook/route.ts`
5. Webhook verifies signature and dispatches event handlers (stubs for DB writes)

**Subscription Verification:**

1. Client calls `POST /api/paypal/verify-subscription` with a subscription ID
2. Route calls `paypal-client.ts:getSubscriptionDetails()` and returns status to client

**State Management:**
- Auth state: React Context (`AuthContext`) provided by `AuthProvider`, consumed via `useAuth()` hook
- No global client-side state library (no Redux, Zustand, etc.)

## Key Abstractions

**AuthProvider / useAuth:**
- Purpose: Global authentication state and session management
- Examples: `src/components/auth/AuthProvider.tsx`
- Pattern: React Context + `createClient` from `@supabase/supabase-js`; exports `useAuth()` hook and the `supabase` client instance

**PayPal Client Module:**
- Purpose: Typed wrapper over PayPal REST API v2
- Examples: `src/app/api/paypal/paypal-client.ts`
- Pattern: Named async functions (`getPayPalAccessToken`, `createPayPalOrder`, `capturePayPalOrder`, `getSubscriptionDetails`) + custom `PayPalError` class for structured error propagation

**Next.js Route Handlers:**
- Purpose: Server-side API endpoints
- Examples: `src/app/api/paypal/*/route.ts`
- Pattern: Named export `POST` (or `GET`) functions receiving `NextRequest`, returning `NextResponse.json()`

## Entry Points

**Root Page:**
- Location: `src/app/page.tsx`
- Triggers: HTTP GET `/`
- Responsibilities: Landing page with navigation to `/login` and `/payment`

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Wraps every page
- Responsibilities: Mounts `AuthProvider`, sets global fonts and metadata

**Auth Callback:**
- Location: `src/app/auth/callback/page.tsx` + `src/app/auth/callback/AuthCallbackHandler.tsx`
- Triggers: OAuth redirect from Supabase/Google to `/auth/callback`
- Responsibilities: Finalize OAuth session exchange, redirect user

**PayPal Webhook:**
- Location: `src/app/api/paypal/webhook/route.ts`
- Triggers: HTTP POST from PayPal servers
- Responsibilities: Verify signature, dispatch to event-type handlers

## Error Handling

**Strategy:** Per-layer try/catch with structured JSON error responses from API routes

**Patterns:**
- API routes catch all errors and return `NextResponse.json({ error: "..." }, { status: 500 })`
- `PayPalError` custom class carries `statusCode` and `responseData` for upstream context
- Webhook returns HTTP 400 on invalid signature, HTTP 200 on all successfully received events

## Cross-Cutting Concerns

**Logging:** `console.log` / `console.error` throughout API routes and webhook handler; no structured logging library
**Validation:** Minimal — PayPal webhook signature verified via PayPal API call; no input schema validation library detected
**Authentication:** Supabase Auth with Google OAuth provider; session managed client-side via `AuthProvider`; API routes do not enforce auth middleware (payment routes are open)

---

*Architecture analysis: 2026-03-22*
