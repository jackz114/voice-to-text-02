# Testing Patterns

**Analysis Date:** 2026-03-22

## Test Framework

**Runner:** None configured

No test framework is installed or configured in this codebase. There are no entries for Jest, Vitest, Mocha, or any other test runner in `package.json` (neither `dependencies` nor `devDependencies`). No `jest.config.*` or `vitest.config.*` files are present.

**Test Files:** Zero test files found. No `*.test.*` or `*.spec.*` files exist anywhere in the repository.

**Run Commands:**
```bash
# No test commands are defined in package.json scripts
# Available scripts are:
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run build:cloudflare  # Cloudflare Workers build
npm run deploy       # Build and deploy to Cloudflare
```

## Test File Organization

**Location:** Not established — no tests exist.

**Naming:** No naming convention in place.

**Structure:** Not applicable.

## Test Structure

No test suites exist. The codebase has no established patterns for:
- `describe` blocks
- `it` / `test` blocks
- `beforeEach` / `afterEach` setup/teardown

## Mocking

**Framework:** None installed.

No mocking patterns established. The following areas would need mocking if tests were added:
- `@supabase/supabase-js` `createClient` — used in `src/lib/supabase.ts`, `src/components/auth/AuthProvider.tsx`, `src/components/auth/LoginForm.tsx`
- `fetch` — used directly in `src/app/api/paypal/paypal-client.ts` for all PayPal API calls
- `process.env` — used throughout for environment configuration
- `next/server` `NextRequest` / `NextResponse` — needed for API route testing

## Fixtures and Factories

**Test Data:** None. No fixture files or factory functions exist.

**Location:** Not established.

## Coverage

**Requirements:** None enforced. No coverage configuration or thresholds defined.

**View Coverage:** Not applicable (no test runner configured).

## Test Types

**Unit Tests:** Not present.

**Integration Tests:** Not present.

**E2E Tests:** Not present. No Playwright, Cypress, or similar tool is installed.

## Areas to Test (Priority Order)

If tests are added, the following areas have the highest value:

**High Priority — API Routes:**
- `src/app/api/paypal/capture-order/route.ts` — multi-step payment flow with multiple error branches
- `src/app/api/paypal/create-order/route.ts` — order creation with validation
- `src/app/api/paypal/webhook/route.ts` — webhook signature verification
- `src/app/api/paypal/verify-subscription/route.ts` — subscription status checks

**High Priority — Utility Functions:**
- `src/app/api/paypal/paypal-client.ts` — `getPayPalAccessToken`, `createPayPalOrder`, `capturePayPalOrder`, `getOrderDetails`, `getSubscriptionDetails` — all pure async functions wrapping fetch, easy to unit test with mocked fetch

**Medium Priority — Components:**
- `src/components/auth/AuthProvider.tsx` — context provider, `useAuth` hook guard
- `src/components/auth/LoginForm.tsx` — form submission, mode switching, error display
- `src/components/auth/UserNav.tsx` — auth-gated rendering

## Recommended Setup (if tests are added)

**Suggested framework:** Vitest (compatible with Next.js, no transform config needed for ESM)

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event
```

**Suggested file placement:** Co-locate test files alongside source:
```
src/app/api/paypal/paypal-client.test.ts
src/components/auth/AuthProvider.test.tsx
src/components/auth/LoginForm.test.tsx
```

**Suggested fetch mock pattern** for `paypal-client.ts` functions:
```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

it("throws PayPalError when token request fails", async () => {
  (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status: 401,
    statusText: "Unauthorized",
    json: async () => ({ error_description: "Invalid credentials" }),
  });
  await expect(getPayPalAccessToken()).rejects.toThrow(PayPalError);
});
```

---

*Testing analysis: 2026-03-22*
