---
phase: 02-review-loop
plan: "02-GAP-UX"
type: enhancement
wave: 3
depends_on: ["02-02-GAP"]
files_modified:
  - src/components/library/KnowledgeLibrary.tsx
autonomous: true
requirements: [UX-01]

must_haves:
  truths:
    - "Knowledge detail modal provides clear path to review action"
  artifacts:
    - path: "src/components/library/KnowledgeLibrary.tsx"
      provides: "Review navigation from detail modal"
---

<objective>
Add review navigation to the knowledge item detail modal so users can easily start reviewing from the library.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/02-review-loop/02-GAPS.md

**User feedback**: Detail modal shows full content but has no button to guide users into review flow.
</context>

<tasks>

<task order="1">
**Add review buttons to detail modal**

File: `src/components/library/KnowledgeLibrary.tsx`

In the detail modal (where `viewingItem` is displayed), add action buttons:

```typescript
<div className="flex gap-3 mt-6">
  <Link
    href="/review"
    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-600"
  >
    🔄 去复习
  </Link>
  <button
    onClick={() => {
      // Mark as reviewed with "Good" rating via API
      fetch("/api/review/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: viewingItem.id,
          rating: "good" // or "easy"
        })
      });
      setViewingItem(null);
    }}
    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
  >
    ✅ 标记为已复习
  </button>
</div>
```

Or simpler - just a link to /review:
```typescript
<Link
  href="/review"
  className="mt-4 block w-full px-4 py-2 bg-blue-500 text-white rounded-lg text-center"
>
  去复习模式
</Link>
```
</task>

</tasks>

<verification>
- [ ] Detail modal has clear action to go to review page
</verification>

<success_criteria>
Knowledge detail modal provides clear path to review action.
</success_criteria>
