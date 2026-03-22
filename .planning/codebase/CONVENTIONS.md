# Coding Conventions

**Analysis Date:** 2026-03-22

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — e.g., `AuthProvider.tsx`, `LoginForm.tsx`, `GoogleAuthButton.tsx`
- Next.js routes: lowercase `page.tsx`, `route.ts`, `layout.tsx`
- Utility/client modules: camelCase `.ts` — e.g., `paypal-client.ts`, `supabase.ts`
- API route handlers live in `src/app/api/<domain>/<action>/route.ts`

**Functions:**
- React components: PascalCase named exports — `export function AuthProvider(...)`, `export function LoginForm(...)`
- Hooks: `use` prefix camelCase — `export function useAuth()`
- API handlers: named exports matching HTTP method — `export async function POST(...)`
- Private utilities: camelCase — `function generateInvoiceId()`, `function generateRequestId()`
- Async event handlers: `handle` prefix — `const handleSubmit = async (e) => ...`

**Variables:**
- camelCase throughout
- Boolean state: descriptive noun — `loading`, `turnstileToken`
- Union literal state: typed string unions — `"login" | "register"`, `User | null`
- Prefix `_` for intentionally unused parameters (enforced by ESLint rule `argsIgnorePattern: "^_"`)

**Types/Interfaces:**
- PascalCase with `interface` keyword preferred over `type` for object shapes
- Interfaces named after domain concept — `AuthContextType`, `PayPalOrder`, `PayPalPurchaseUnit`, `LoginFormProps`
- Internal API-shape interfaces are file-private (not exported): `PayPalOrderAmount`, `PayPalPaymentCapture`
- Public types re-exported via `export type { PayPalOrder, PayPalPurchaseUnit }` at file bottom

**Constants:**
- SCREAMING_SNAKE_CASE for module-level config — `PAYPAL_CLIENT_ID`, `PAYPAL_API_URL`

## Code Style

**Formatter:** Prettier
- Config: `.prettierrc`
- Double quotes (`"`) for strings
- Semicolons on
- 2-space indentation, no tabs
- Print width 100
- Trailing commas `es5`
- Arrow function parens always: `(x) => x`
- LF line endings

**Linter:** ESLint v9 flat config
- Config: `eslint.config.mjs`
- TypeScript parser (`@typescript-eslint/parser`) with `projectService: true`
- Rules: `@typescript-eslint/recommended` + `react/recommended` + `react-hooks/recommended`
- `@typescript-eslint/no-unused-vars` is `warn` (not error); prefix `_` to suppress
- `no-console` is `off` — `console.log` and `console.error` are used freely
- `react/react-in-jsx-scope` is `off` (no `import React` needed)
- `react/prop-types` is `off` (TypeScript handles type checking)
- Prettier compat layer applied last, disabling format-conflicting ESLint rules

## Import Organization

**Order (observed pattern):**
1. Framework/Next.js imports — `import { NextRequest, NextResponse } from "next/server"`
2. Third-party library imports — `import { createClient } from "@supabase/supabase-js"`
3. Internal path-alias imports — `import { UserNav } from "@/components/auth/UserNav"`
4. Relative imports — `import { getPayPalAccessToken } from "../paypal-client"`

**Path Aliases:**
- `@/` maps to `src/` (Next.js default, used in page files)

## Directive Patterns

**Client components:** `"use client"` directive on the first line when component uses hooks or browser APIs.
- `src/app/page.tsx` — `"use client"` (uses client-side rendering)
- `src/components/auth/LoginForm.tsx` — `"use client"` (uses `useState`)
- `src/components/auth/AuthProvider.tsx` — `"use client"` (uses `useContext`, `useEffect`)

**Server components/routes:** No directive — default in Next.js App Router.
- `src/app/layout.tsx` — no directive (server component)
- `src/app/api/*/route.ts` — no directive (server-only API routes)

## Error Handling

**API Routes (server-side):**
- Wrap entire handler body in `try/catch`
- Validate input first; return `400` with `{ error, code }` shape before processing
- Check for domain-specific custom error classes (`instanceof PayPalError`) before generic catch
- Map known error codes to specific HTTP status codes (e.g., 422 for uncapturable orders)
- Generic fallback: `500` with `{ error: "...", code: "INTERNAL_ERROR" }`
- Log errors with `console.error("context:", error)` in catch block

Example pattern from `src/app/api/paypal/capture-order/route.ts`:
```typescript
try {
  if (!orderId) return NextResponse.json({ error: "...", code: "..." }, { status: 400 });
  // ... logic
} catch (error) {
  if (error instanceof PayPalError) {
    return NextResponse.json({ error: error.message, code: "PAYPAL_ERROR" }, { status: error.statusCode || 500 });
  }
  return NextResponse.json({ error: "...", code: "INTERNAL_ERROR" }, { status: 500 });
}
```

**Client components:**
- `try/catch/finally` inside async handlers
- `finally` always resets loading state: `setLoading(false)`
- Error messages extracted with: `error instanceof Error ? error.message : "fallback"`
- User-facing errors via `alert()` (simple approach, no toast library yet)

**Custom Error Classes:**
- Domain-specific errors extend `Error` with extra fields
- Pattern from `src/app/api/paypal/paypal-client.ts`:
```typescript
export class PayPalError extends Error {
  constructor(message: string, public statusCode?: number, public responseData?: unknown) {
    super(message);
    this.name = "PayPalError";
  }
}
```

**HTTP client (fetch) errors:**
- Check `response.ok` after every `fetch` call
- Parse error body with `.catch(() => ({}))` fallback to avoid double-throw
- Immediately throw domain error: `throw new PayPalError(..., response.status, errorData)`

## Logging

**Framework:** `console` (native)

**Patterns:**
- `console.log(label, data)` for success/info events in API routes
- `console.error(label, error)` in catch blocks
- Verbose object logging in success path (e.g., logging payment capture summary)
- `no-console` ESLint rule is disabled — console usage is unrestricted

## Comments

**Language:** Chinese (Simplified) used throughout for inline comments and section headings.

**When to Comment:**
- Multi-step procedures get numbered step comments: `// 步骤 1: 验证订单状态`
- Section dividers for logical blocks: `// 接口定义`, `// 错误类`, `// 获取 PayPal 访问令牌`
- Explanatory notes for non-obvious decisions: `// 官方推荐的最佳实践`
- No JSDoc/TSDoc annotations on functions (not used in this codebase)

## Function Design

**Size:** Functions are kept focused on a single operation. API client file (`paypal-client.ts`) separates each PayPal endpoint into its own exported function.

**Parameters:** Plain positional params for simple cases; options object pattern for optional extras:
```typescript
export async function createPayPalOrder(
  accessToken: string,
  amount: string,
  currency: string,
  description: string,
  options?: { customId?: string; invoiceId?: string }
): Promise<PayPalOrder>
```

**Return Values:** Functions return typed promises. API routes always return `NextResponse.json(...)`.

## Module Design

**Exports:**
- Named exports preferred over default exports for components and utilities
- Exception: Next.js page/layout files use `export default` (framework requirement)
- Types re-exported explicitly at file end: `export type { PayPalOrder, PayPalPurchaseUnit }`

**Barrel Files:** Not used. Import directly from the module file path.

**Context Pattern:**
- React context created with `createContext<Type | undefined>(undefined)`
- Custom hook (`useAuth`) throws descriptive error if used outside provider
- Provider and hook co-located in the same file (`AuthProvider.tsx`)

## State Management

**Local state:** React `useState` for component-level UI state (loading flags, form values, mode toggles).

**Global state:** Zustand (`zustand` ^5) is in dependencies but not yet observed in source files. Intended for cross-component state.

**Auth state:** React Context via `AuthProvider` wrapping the full app in `src/app/layout.tsx`.

---

*Convention analysis: 2026-03-22*
