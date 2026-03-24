---
phase: 02-review-loop
plan: "04-GAP"
type: fix
wave: 2
depends_on: []
files_modified:
  - src/components/review/ReviewSession.tsx
  - src/app/review/page.tsx
autonomous: true
requirements: [UI-03]

must_haves:
  truths:
    - "Empty state is friendly and offers proactive actions"
    - "User can browse all items for review, not just due items"
  artifacts:
    - path: "src/components/review/ReviewSession.tsx"
      provides: "Empty state UI with proactive review button"
---

<objective>
Improve /review empty state and add proactive review entry point so users can review even when no items are due today.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/02-review-loop/02-04-SUMMARY.md
@.planning/phases/02-review-loop/02-GAPS.md

**User feedback**: "I think users should have the option to review proactively. When to review shouldn't be forced by us, but chosen by the user. We just provide convenience."

**Current behavior**: When no items are due, the page shows nothing or minimal content.

**Desired behavior**:
1. Friendly empty state message
2. Option to enter "browse mode" to review any item
3. Browse mode bypasses FSRS scheduling (no rating updates to scheduling)
</context>

<tasks>

<task order="1">
**Add empty state and proactive review mode to ReviewSession**

File: `src/components/review/ReviewSession.tsx`

Add new state:
```typescript
type ReviewMode = "scheduled" | "browse"; // scheduled = due items only, browse = all items

const [reviewMode, setReviewMode] = useState<ReviewMode>("scheduled");
```

Modify data fetching:
```typescript
// Fetch based on mode
const fetchItems = async () => {
  if (reviewMode === "scheduled") {
    // Use existing /api/review/today endpoint
    const res = await fetch("/api/review/today");
    const data = await res.json();
    setItems(data.items || []);
  } else {
    // Fetch all items from /api/library/list
    const res = await fetch("/api/library/list");
    const data = await res.json();
    // Map library items to review card format
    setItems(data.items?.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      // No FSRS fields needed for browse mode
    })) || []);
  }
};
```

Empty state UI (when scheduled mode has no items):
```typescript
if (items.length === 0 && reviewMode === "scheduled") {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold">今日复习已完成！</h2>
      <p className="text-gray-500">
        今天没有需要复习的知识条目，明天再来吧～
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => setReviewMode("browse")}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          📚 主动复习（浏览全部）
        </button>
        <Link href="/library"
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          去知识库
        </Link>
      </div>
    </div>
  );
}
```

Browse mode indicator:
```typescript
{reviewMode === "browse" && (
  <div className="mb-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
    <span>📚 主动复习模式 - 浏览所有知识条目</span>
    <button
      onClick={() => setReviewMode("scheduled")}
      className="text-sm text-blue-600 hover:underline"
    >
      返回今日复习
    </button>
  </div>
)}
```

Modify rating behavior for browse mode:
- In browse mode, after viewing content, show "标记为已学习" button instead of FSRS ratings
- Or simply allow browsing without any action required
</task>

<task order="2">
**Update review page layout if needed**

File: `src/app/review/page.tsx`

Ensure the page container handles both modes properly. No major changes needed if ReviewSession encapsulates the logic.
</task>

</tasks>

<verification>

## Self-Check

- [ ] When no due items, see friendly "今日复习已完成" message
- [ ] "主动复习" button switches to browse mode
- [ ] Browse mode shows all knowledge items
- [ ] Can return to scheduled mode
- [ ] Browse mode has different UI (no FSRS rating buttons or adapted UI)

</verification>

<success_criteria>
- Empty state is informative and friendly
- Users can proactively review via "browse mode"
- Browse mode clearly indicated with option to return
</success_criteria>
