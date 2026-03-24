---
phase: 02-review-loop
plan: "02-GAP"
type: fix
wave: 2
depends_on: []
files_modified:
  - src/components/library/DomainSidebar.tsx
  - src/components/library/KnowledgeItemCard.tsx
autonomous: true
requirements: [UI-01, UI-02]

must_haves:
  truths:
    - "Sidebar always shows all domains, current selection is highlighted"
    - "Grid cards have delete capability same as list rows"
  artifacts:
    - path: "src/components/library/DomainSidebar.tsx"
      provides: "Persistent domain list with selection highlight"
    - path: "src/components/library/KnowledgeItemCard.tsx"
      provides: "Delete button on grid cards"
---

<objective>
Fix knowledge library UX issues: make domain filter sidebar persistent with highlight state, and add delete button to grid view cards.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/phases/02-review-loop/02-02-SUMMARY.md
@.planning/phases/02-review-loop/02-GAPS.md

**Problems identified in verification**:
1. Clicking a domain in sidebar hides other domains - user must click "全部" to see others again
2. Grid/card view has no delete button (only list view has it)
</context>

<tasks>

<task order="1">
**Fix DomainSidebar to always show all domains**

File: `src/components/library/DomainSidebar.tsx`

Current behavior likely filters the domain list based on selection. Change to:
- Always render all domains (from a static list or API)
- Add `selectedDomain: string | null` prop
- Highlight selected domain with different background/text color
- Clicking a different domain changes selection, doesn't hide others

Interface change:
```typescript
interface DomainSidebarProps {
  domains: Array<{ name: string; count: number }>;
  selectedDomain: string | null; // null = "全部"
  onSelect: (domain: string | null) => void;
}
```

Rendering logic:
```typescript
// Always show "全部" first
<button
  onClick={() => onSelect(null)}
  className={selectedDomain === null ? "bg-blue-500 text-white" : "bg-gray-100"}
>
  全部 ({totalCount})
</button>

// Then all domains
{domains.map(d => (
  <button
    key={d.name}
    onClick={() => onSelect(d.name)}
    className={selectedDomain === d.name ? "bg-blue-500 text-white" : "bg-gray-100"}
  >
    {d.name} ({d.count})
  </button>
))}
```
</task>

<task order="2">
**Add delete button to KnowledgeItemCard in grid mode**

File: `src/components/library/KnowledgeItemCard.tsx`

Add a delete button that appears on hover (or always visible in corner):
- Position: absolute top-right corner of card
- Icon: trash/delete icon (or "删除" text)
- On click: call `onDelete(item.id)` with confirmation
- Only show if `onDelete` prop is provided

Props to add:
```typescript
interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  viewMode: "list" | "grid";
  onClick?: () => void;
  onDelete?: (id: string) => void; // NEW
}
```

Grid card layout:
```typescript
<div className="relative group">
  {/* Card content */}

  {/* Delete button - visible on hover or always */}
  {onDelete && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (confirm("确定要删除这条知识吗？")) {
          onDelete(item.id);
        }
      }}
      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
    >
      🗑️
    </button>
  )}
</div>
```
</task>

<task order="3">
**Update KnowledgeLibrary to pass onDelete to cards**

File: `src/components/library/KnowledgeLibrary.tsx`

Ensure the grid view cards receive the `onDelete` prop:
```typescript
{viewMode === "grid" ? (
  <KnowledgeItemCard
    key={item.id}
    item={item}
    viewMode="grid"
    onClick={() => setViewingItem(item)}
    onDelete={handleDelete} // ADD THIS
  />
) : ...}
```
</task>

</tasks>

<verification>

## Self-Check

- [ ] Sidebar shows all domains regardless of selection
- [ ] Selected domain is visually highlighted
- [ ] Clicking another domain switches selection without hiding others
- [ ] Grid view cards show delete button on hover
- [ ] Delete confirmation works and item is removed

</verification>

<success_criteria>
- Domain sidebar always displays all available domains
- Current selection is clearly indicated by highlight style
- Grid view cards have functional delete button with confirmation
</success_criteria>
