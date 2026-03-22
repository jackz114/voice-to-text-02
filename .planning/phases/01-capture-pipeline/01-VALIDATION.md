# Phase 01: Capture Pipeline — Validation Architecture

**Phase:** 01-capture-pipeline
**Created:** 2026-03-22

---

## Automated Checks

Each plan's `<verify>` block runs one automated command that must pass before the task is considered done.

| Plan | Task | Automated Command | What It Confirms |
|------|------|-------------------|------------------|
| 01-01 | Task 1 | `npx tsc --noEmit` on `src/db/schema.ts` | All 5 table definitions are valid TypeScript |
| 01-01 | Task 2 | Node script via `dotenv` + `postgres` client | DB tables exist in Supabase (if DATABASE_URL is set); migration SQL generated otherwise |
| 01-02 | Task 1 | `npx tsc --noEmit` on `capture-client.ts` | OpenAI schemas, zod/v3 import, chunkText compile cleanly |
| 01-02 | Task 2 | `npx tsc --noEmit` on `extract/route.ts` | Route handler compiles; auth + length guards present |
| 01-03 | Task 1 | `npx tsc --noEmit` on `TextPasteInput.tsx` | Component props interface and Tailwind classes compile |
| 01-03 | Task 2 | `npx tsc --noEmit` on `capture/page.tsx` | Page state machine, auth guard, and API call compile |
| 01-04 | Task 1 | `npx tsc --noEmit` on `ConfirmationCards.tsx` | Card state machine, tag input, accept/reject/edit compile |
| 01-04 | Task 2a | `npx tsc --noEmit` on `confirm/route.ts` | DB inserts, auth guard, response shape compile |
| 01-04 | Task 2b | `npx tsc --noEmit` on `capture/page.tsx` | Wired ConfirmationCards and handleConfirm compile |

### Linting

After all plans in a wave complete:
```bash
npm run lint
```
No ESLint errors permitted. Warnings for unused variables prefixed with `_` are acceptable (project convention).

### TypeScript

Full project check after each plan:
```bash
npx tsc --noEmit
```
Errors in any file are a blocking failure for that plan.

---

## Feedback Loops

### Per-task feedback

Every `auto` task ends with an `<acceptance_criteria>` checklist. The executor verifies each bullet using `grep` or file existence checks before marking the task done.

### Cross-plan integration check

After Plan 01-03 completes (before 01-04 starts):
```bash
npm run dev
# Manual: visit /capture — must redirect to /login when unauthenticated
```

After Plan 01-04 Task 2a completes (before Task 2b starts):
```bash
curl -X POST http://localhost:3000/api/capture/confirm \
  -H "Content-Type: application/json" \
  -d '{"items":[]}' | jq .code
# Expected: "INVALID_ITEMS" (no auth header = 401 first, so test with no auth)
```

---

## Sampling Strategy

**Unit-level:** Every task's `<verify>` command is deterministic and runs in < 60 seconds. No sampling needed — all tasks are verified fully.

**Integration-level:** Plan 01-04's checkpoint (Task 3) is the primary integration gate. It covers the full user flow end-to-end:

1. Auth guard on `/capture`
2. TextPasteInput → extract API → ConfirmationCards rendering
3. Per-card accept/reject/edit interactions
4. Confirm API → DB write → success message

This checkpoint is human-verified (blocking gate) and covers all integration paths in a single pass.

**Database verification:** After the checkpoint passes, the human verifier confirms rows in Supabase Dashboard:
- `knowledge_items`: correct `user_id`, `source_type = "text_paste"`, `created_at` set by `defaultNow()`
- `review_state`: correct `knowledge_item_id` FK, `next_review_at = tomorrow`, FSRS fields initialized to 0

---

## Known Gaps and Mitigations

| Gap | Mitigation |
|-----|-----------|
| No automated integration tests (project has none) | Human-verify checkpoint covers end-to-end flow |
| DATABASE_URL may not be configured when Plan 01-01 runs | Task 2 falls back to `drizzle-kit generate` only; executor documents migration as pending |
| OpenAI API key required for Plan 01-02 live testing | TypeScript + auth checks verify structure; live extraction tested in Plan 01-04 checkpoint |
| Cloudflare Workers runtime not tested locally | `npm run dev` (Next.js) used for development; `npm run cf:dev` available for pre-deploy check |

---

*Validation architecture for Phase 01-capture-pipeline*
*Created: 2026-03-22*
