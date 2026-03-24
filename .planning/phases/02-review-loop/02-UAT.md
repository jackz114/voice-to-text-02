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
started: 2026-03-24T12:00:00Z
updated: 2026-03-24T12:50:00Z
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
result: pass
reported: "修复后页面正常加载，左侧栏显示领域和计数"

### 4. Knowledge Library - Domain Filtering
expected: |
  Clicking a domain filters the list to show only items from that domain.
  Clicking "全部" shows all items again. Sidebar remains visible with selection highlighted.
result: pass

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
  Hovering over a list item reveals a delete button. Clicking it shows a custom confirmation dialog.
  Confirming removes the item immediately and refetches the list.
result: pass
note: "修复: 列表模式遗漏 ConfirmDialog 组件"

### 8. Knowledge Library - Delete Item (Grid Mode)
expected: |
  Hovering over a grid card reveals a delete button. Clicking it shows custom confirmation dialog.
  Confirming removes the item immediately.
result: pass

### 9. Review Session Page - Auth Guard
expected: |
  Visiting /review while not logged in shows appropriate auth state.
  After login, review session loads.
result: pass

### 10. Review Session - Today's Queue
expected: |
  Page shows items due for review today in a card stack.
  Cards display title, content preview, and domain info.
result: pass
reported: "页面加载成功，显示'今日复习已完成'空状态"

### 11. Review Session - Click to Reveal
expected: |
  Initially only the title/question is visible.
  Clicking "点击揭示内容" button reveals the full content and rating buttons.
result: blocked
blocked_by: prior-phase
reason: "当前没有待复习条目，无法测试卡片揭示功能"

### 12. Review Session - Rating Buttons
expected: |
  After revealing content, 4 emoji rating buttons appear: Again (red), Hard (orange), Good (green), Easy (blue).
  Clicking a button submits the rating and advances to next card.
result: blocked
blocked_by: prior-phase
reason: "当前没有待复习条目，无法测试评分功能"

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
blocked_by: prior-phase
reason: "当前没有待复习条目，无法测试撤销功能"

### 15. Review Session - Empty State with Browse Mode
expected: |
  When no items are due today, shows friendly message like "今日暂无复习条目".
  Provides a "浏览全部" or "主动复习" option to review items not yet due.
result: pass
reported: "正确显示'今日复习已完成'和'主动复习（浏览全部）'按钮"

### 16. Audio Capture - Record Button
expected: |
  On /capture page, clicking the record button starts recording with waveform visualization.
  Recording indicator shows active state.
result: skipped
reason: "浏览器自动化测试无法获取麦克风权限，无法测试录制功能"

### 17. Audio Capture - Pause/Resume
expected: |
  During recording, pause button pauses recording. Resume button continues.
  Waveform stops during pause, resumes after.
result: skipped
reason: "依赖 Test 16，无法测试"

### 18. Audio Capture - Stop and Transcribe
expected: |
  Clicking "停止并转写" stops recording, uploads audio to Supabase Storage,
  calls transcription API, and populates the text area with transcript.
result: skipped
reason: "依赖 Test 16，无法测试"

### 19. Audio Capture - Transcript Population
expected: |
  After transcription completes, the captured text appears in the left text input area,
  ready for extraction and saving to knowledge library.
result: skipped
reason: "依赖 Test 16，无法测试"

### 20. Review API - FSRS Scheduling Persistence
expected: |
  After rating an item in review session, the item's nextReviewAt, stability, difficulty,
  and reviewCount are updated in the database and reflected in the library detail modal.
result: blocked
blocked_by: prior-phase
reason: "当前没有待复习条目，无法测试评分持久化"

## Summary

total: 20
passed: 10
issues: 0
pending: 0
skipped: 5
blocked: 5

## Gaps

[none - all issues resolved]
