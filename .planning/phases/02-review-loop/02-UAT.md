---
status: complete
phase: 02-review-loop
source:
  - 02-01-SUMMARY.md
  - 02-02-SUMMARY.md
  - 02-03-SUMMARY.md
  - 02-04-SUMMARY.md
  - 02-05-SUMMARY.md
  - 02-05-GAP-SUMMARY.md
  - 02-06-SUMMARY.md
started: 2026-03-23T10:00:00Z
updated: 2026-03-24T08:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Application starts from fresh state, dev server boots, homepage loads
result: pass

### 2. Knowledge Library Page - Auth Guard
expected: |
  Visiting /library while not logged in shows loading state then "请先登录" message with a link to /login.
  After logging in and returning, the library loads and shows knowledge items.
result: pass

### 3. Knowledge Library - Domain Sidebar Display
expected: |
  Left sidebar shows all domains with item counts (e.g., "计算机科学 (2)", "心理学 (1)")
  "全部" option at top shows total count. All domains visible simultaneously.
result: issue
reported: "Clicking a domain hides other domains, forcing user to click '全部' before switching — poor UX"
severity: major

### 4. Knowledge Library - Domain Filtering
expected: |
  Clicking a domain filters the list to show only items from that domain.
  Clicking "全部" shows all items again. Sidebar remains visible with selection highlighted.
result: issue
reported: "Same issue as Test 3: Sidebar does not remain visible when a domain is clicked. The domain list refreshes/hides instead of staying visible with the selection highlighted."
severity: major
related_test: 3

### 5. Knowledge Library - List/Grid Toggle
expected: |
  Toggle buttons switch between list view (compact rows) and grid view (card layout).
  Items render correctly in both layouts.
result: pass

### 6. Knowledge Library - Item Detail Modal (List Mode)
expected: |
  Clicking an item in list view opens a modal showing full content, tags, source link, dates, and review scheduling info.
  Clicking outside or a close button dismisses the modal.
result: pass

### 7. Knowledge Library - Delete Item (List Mode)
expected: |
  Hovering over a list item reveals a delete button. Clicking it shows a confirm() dialog.
  Confirming removes the item immediately and refetches the list.
result: issue
reported: "没有专门设计的确认取消界面，是由浏览器弹出的，删除功能正常，但视觉反馈不美观"
severity: minor

### 8. Knowledge Library - Delete Item (Grid Mode)
expected: |
  Hovering over a grid card reveals a delete button. Clicking it shows confirm() dialog.
  Confirming removes the item immediately.
result: issue
reported: "跟test7测试结果相同：使用浏览器默认confirm对话框，视觉反馈不美观"
severity: minor

### 9. Review Session Page - Auth Guard
expected: |
  Visiting /review while not logged in shows appropriate auth state.
  After login, review session loads.
result: pass
reported: "自动跳转到登录页面即可，无需显示认证状态"

### 10. Review Session - Today's Queue
expected: |
  Page shows items due for review today in a card stack.
  Cards display title, content preview, and domain info.
result: issue
reported: "主动复习模式默认复习所有卡片不友好，应该让用户可以选择哪个领域来复习"
severity: major

### 11. Review Session - Click to Reveal
expected: |
  Initially only the title/question is visible.
  Clicking "点击揭示内容" button reveals the full content and rating buttons.
result: issue
reported: "没有评分按钮"
severity: major

### 12. Review Session - Rating Buttons
expected: |
  After revealing content, 4 emoji rating buttons appear: Again (red), Hard (orange), Good (green), Easy (blue).
  Clicking a button submits the rating and advances to next card.
result: skipped
reason: "网页端无法查看，用户建议在部署后手机端测试"

### 13. Review Session - Swipe Gestures
expected: |
  Swiping a card right triggers Easy rating. Swiping left triggers Again rating.
  Card animates off-screen smoothly with framer-motion.
result: skipped
reason: "网页端无法滑动操作，等部署到域名后在手机上测试"

### 14. Review Session - Undo Bar
expected: |
  After rating, a 60-second undo bar appears with the option to correct the rating.
  Clicking a different rating re-submits and updates the scheduling.
result: blocked
blocked_by: other
reason: "没看到评分系统，无法测试"

### 15. Review Session - Empty State with Browse Mode
expected: |
  When no items are due today, shows friendly message like "今日暂无复习条目".
  Provides a "浏览全部" or "主动复习" option to review items not yet due.
result: pass

### 16. Audio Capture - Record Button
expected: |
  On /capture page, clicking the record button starts recording with waveform visualization.
  Recording indicator shows active state.
result: pass

### 17. Audio Capture - Pause/Resume
expected: |
  During recording, pause button pauses recording. Resume button continues.
  Waveform stops during pause, resumes after.
result: pass

### 18. Audio Capture - Stop and Transcribe
expected: |
  Clicking "停止并转写" stops recording, uploads audio to Supabase Storage,
  calls transcription API, and populates the text area with transcript.
result: issue
reported: "转写失败: Failed query: insert into \"transcriptions\" (...) values (...) returning \"id\""
severity: blocker

### 19. Audio Capture - Transcript Population
expected: |
  After transcription completes, the captured text appears in the left text input area,
  ready for extraction and saving to knowledge library.
result: blocked
blocked_by: other
reason: "test18报错，无法测试"

### 20. Review API - FSRS Scheduling Persistence
expected: |
  After rating an item in review session, the item's nextReviewAt, stability, difficulty,
  and reviewCount are updated in the database and reflected in the library detail modal.
result: blocked
blocked_by: other
reason: "没有看到评分系统，无法测试"

## Summary

total: 20
passed: 7
issues: 6
pending: 0
skipped: 2
blocked: 3

## Gaps

- truth: "All domains remain visible in sidebar when one is selected"
  status: failed
  reason: "User reported: Clicking a domain hides other domains, forcing user to click '全部' before switching — poor UX"
  severity: major
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Sidebar remains visible with selection highlighted when filtering"
  status: failed
  reason: "Same as Gap 1: Sidebar refreshes/hides when domain selected instead of persisting with highlight"
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Delete confirmation uses custom modal instead of browser confirm()"
  status: failed
  reason: "User reported: 没有专门设计的确认取消界面，是由浏览器弹出的，删除功能正常，但视觉反馈不美观"
  severity: minor
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Browse mode allows selecting specific domain for proactive review"
  status: failed
  reason: "User reported: 主动复习模式默认复习所有卡片不友好，应该让用户可以选择哪个领域来复习"
  severity: major
  test: 10
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Review card reveals content and shows rating buttons when clicked"
  status: failed
  reason: "User reported: 没有评分按钮"
  severity: major
  test: 11
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Transcription API successfully inserts into database"
  status: failed
  reason: "User reported: 转写失败: Failed query: insert into \"transcriptions\" (...)"
  severity: blocker
  test: 18
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
