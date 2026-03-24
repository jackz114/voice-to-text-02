---
status: testing
phase: 03-retention-engine
source:
  - 03-01-SUMMARY.md
  - 03-02-SUMMARY.md
  - 03-03-SUMMARY.md
  - 03-04-SUMMARY.md
  - 03-05-SUMMARY.md
  - 03-06-SUMMARY.md
  - 03-07-SUMMARY.md
started: 2026-03-24T12:00:00Z
updated: 2026-03-24T12:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files).
Start the application from scratch. Server boots without errors, any seed/migration completes,
and a primary query (health check, homepage load, or basic API call) returns live data.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test

expected: Application starts from fresh state, dev server boots, homepage loads
result: pass

### 2. Global Search - Cmd+K Shortcut

expected: |
Pressing Cmd+K (or Ctrl+K on Windows) opens the search modal.
Modal shows search input, recent searches (if any), and keyboard shortcuts hint at bottom.
result: fixed - 已移除 Cmd+K 快捷键功能，改为仅通过 SearchTrigger 按钮触发

### 3. Global Search - SearchTrigger Button

expected: |
Clicking the search trigger button (in header/navigation) opens the search modal.
Button displays "搜索" or search icon with Cmd+K shortcut hint.
result: fixed - 已在首页导航栏添加 SearchTrigger 图标按钮，同时移除了 Cmd+K 提示

### 4. Global Search - Typing and Debounce

expected: |
Typing in the search modal input triggers search after 300ms debounce.
Results show title, excerpt with highlighted matching terms (<mark> tags), domain badge, and tags.
result: [pending]

### 5. Global Search - Keyboard Navigation

expected: |
Using ↑↓ arrow keys navigates through search results.
Pressing Enter opens the selected result.
Pressing ESC closes the modal.
result: [pending]

### 6. Global Search - History Persistence

expected: |
After performing searches, closing and reopening the modal shows recent search history.
History items can be clicked to re-run the search.
Maximum 8 history items are stored in localStorage.
result: [pending]

### 7. Full Search Page - Access and Basic Search

expected: |
Navigating to /search shows full search interface with search input.
Typing and submitting shows search results with highlighted excerpts, domain badges, tags, and relevance scores.
result: [pending]

### 8. Full Search Page - Domain Filter

expected: |
Domain filter dropdown shows user's knowledge domains.
Selecting a domain filters results to that domain only.
URL updates to include domain parameter (shareable links).
result: [pending]

### 9. Full Search Page - URL Sync

expected: |
Searching updates the URL with ?q= query parameter.
Refreshing the page preserves the search query and results.
Direct navigation to /search?q=react shows results for "react".
result: [pending]

### 10. Full Search Page - Empty State

expected: |
Searching with no results shows empty state with guidance:

- Search suggestions (simpler keywords, spelling checks)
- Popular tags for exploration
- "Create new note" button that pre-fills title with search query
  result: [pending]

### 11. Full Search Page - Pagination

expected: |
When more than 10 results exist, pagination controls appear.
Previous/Next buttons navigate between pages.
Results count shows total number of matches.
result: [pending]

### 12. Notification Settings - Access from UserNav

expected: |
Clicking user avatar/menu in header shows dropdown with "通知设置" or "Notification Settings" option.
Clicking it navigates to /settings/notifications.
result: fixed - 安装了 @supabase/ssr，使用 createServerClient 处理 cookies，服务端可以正确获取用户 session

### 13. Notification Settings - Email Toggle

expected: |
Settings page shows toggle for email notifications.
Toggle state persists after page refresh.
Visual feedback shows current state (on/off).
result: [pending]

### 14. Notification Settings - Time Picker

expected: |
Daily reminder time picker allows selecting hour and minute (HH:mm format).
Selected time persists after refresh.
result: [pending]

### 15. Notification Settings - Timezone Selector

expected: |
Timezone dropdown shows major timezones (Asia/Shanghai, America/New_York, etc.).
Selected timezone persists after refresh.
result: [pending]

### 16. Notification Settings - Domain Filters

expected: |
Domain filter section shows user's knowledge domains as toggle buttons.
Selecting/deselecting domains updates the filter preferences.
Empty selection means "all domains".
result: [pending]

### 17. Notification Settings - Display Name

expected: |
Display name input allows entering personalized name (max 50 chars).
Name appears in email greetings.
Value persists after refresh.
result: [pending]

### 18. Notification Settings - Save Functionality

expected: |
Clicking "Save" button shows success message.
Error state shows error message if save fails.
Settings are immediately effective for future emails.
result: [pending]

### 19. Database Schema - Search Vector

expected: |
(Developer verification) knowledge_items table has search_vector column with tsvector type.
GIN index knowledge_items_search_idx exists.
result: [pending]

### 20. API - Search Endpoint

expected: |
GET /api/search?q=react returns JSON with results array.
Each result has id, title, content, excerpt with <mark> highlights, domain, tags, rank.
Unauthenticated requests return 401.
result: [pending]

### 21. API - Notification Preferences CRUD

expected: |
GET /api/notifications/preferences returns user's preferences.
POST /api/notifications/preferences updates preferences with validation.
Changes reflect immediately in subsequent GET requests.
result: [pending]

### 22. Email Template - Daily Reminder

expected: |
(Code review or test email) Daily reminder email template includes:

- Personalized greeting with username
- Count of due items with urgency color coding
- Domain badges (no content snippets)
- CTA button linking to /review?session=daily&source=email
- Unsubscribe and settings links in footer
  result: [pending]

### 23. Cron Trigger - Daily Email

expected: |
(Developer verification) wrangler.jsonc includes cron trigger "0 \* \* \* \*".
POST /api/cron/daily-email with CRON_SECRET returns processed user count.
Endpoint protected by Bearer token authorization.
result: [pending]

## Summary

total: 23
passed: 0
issues: 0
pending: 20
skipped: 0
blocked: 0
fixed: 3

## Gaps

1. **Cmd+K Shortcut Removed** (Test 2) - 已移除快捷键功能，避免与浏览器冲突
2. **SearchTrigger Added** (Test 3) - 已在首页导航栏添加搜索按钮
3. **Server Auth Fixed** (Test 12) - 使用 @supabase/ssr 的 createServerClient 处理服务端认证

## Fixes Applied

| Issue | File | Change |
|-------|------|--------|
| Cmd+K 冲突 | `src/hooks/useCommandMenu.ts` | 移除了 Cmd+K 快捷键监听，保留 ESC 关闭功能 |
| 缺少搜索按钮 | `src/app/page.tsx` | 添加 SearchTrigger 和 SearchModal 到导航栏 |
| Cmd+K 提示残留 | `src/components/search/SearchTrigger.tsx` | 移除了按钮上的 Cmd+K 提示文字 |
| 登录循环 | `src/lib/supabase.ts` | 添加 `createServerSupabaseClient()` 函数使用 `@supabase/ssr` |
| 登录循环 | `src/app/settings/notifications/page.tsx` | 改用服务端 supabase 客户端处理认证 |
| 依赖 | `package.json` | 安装 `@supabase/ssr@latest` |
