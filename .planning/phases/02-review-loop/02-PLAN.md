# Phase 2 Gap Fixes — Plan

修复 Phase 2 UAT 发现的 6 个 gaps。

---

## Gap 1 & 2: Domain Sidebar 显示问题

**Severity**: major
**Root Cause**: `KnowledgeLibrary.tsx` 的 `allDomains` 从过滤后的 `items` 计算，导致选择 domain 后 sidebar 只显示选中项

### Fix-02-01: Decouple Domain List from Filtered Items

**Files to modify**:
- `src/components/library/KnowledgeLibrary.tsx`
- `src/app/api/library/domains/route.ts` (new)

**Changes**:
1. 创建新 API 路由 `/api/library/domains`，返回所有 domains 及其计数（不受过滤影响）
2. 修改 `KnowledgeLibrary` 组件，独立获取 domain 列表
3. `DomainSidebar` 接收完整的 domain 列表，不受当前过滤影响

**Implementation notes**:
- API 应返回 `{ domains: string[], counts: Record<string, number> }`
- 组件加载时同时获取 items 和 domains
- 选择 domain 时只刷新 items，不刷新 domains

---

## Gap 3: 删除确认对话框

**Severity**: minor
**Root Cause**: `KnowledgeItemCard.tsx` 使用原生 `confirm()`

### Fix-02-02: Custom Delete Confirmation Modal

**Files to modify**:
- `src/components/library/KnowledgeItemCard.tsx`
- `src/components/ui/ConfirmDialog.tsx` (new or use existing AlertDialog pattern)

**Changes**:
1. 创建可复用的 `ConfirmDialog` 组件（使用现有 UI 组件模式）
2. 在 `KnowledgeItemCard` 中使用 `useState` 管理 dialog 显示状态
3. Dialog 内容："确定要删除这条知识吗？" + "取消"/"删除" 按钮
4. 删除按钮使用红色样式

**Implementation notes**:
- 可使用 `@radix-ui/react-dialog` 或现有 modal 模式
- 支持按 ESC 关闭，点击遮罩关闭
- 删除按钮获取焦点，防止误操作

---

## Gap 4: Browse 模式领域选择

**Severity**: major
**Root Cause**: `ReviewSession.tsx` 的 browse 模式没有 domain 筛选功能

### Fix-02-03: Domain Filter for Browse Mode

**Files to modify**:
- `src/components/review/ReviewSession.tsx`
- `src/app/api/library/list/route.ts`

**Changes**:
1. 修改 `/api/library/list` 支持可选的 `domain` 查询参数
2. 在 browse 模式 header 添加 domain 下拉选择器
3. 选项包括 "全部领域" + 所有可用 domains
4. 选择 domain 时重新获取 filtered items

**Implementation notes**:
- 复用 KnowledgeLibrary 中的 domain 列表获取逻辑
- 使用原生 `<select>` 或自定义 dropdown 组件
- 保持选择状态在组件内

---

## Gap 5: 评分按钮 UX 问题

**Severity**: major
**Root Cause**: UX 混淆 — 评分按钮只在揭示内容后显示，且 browse 模式没有评分

### Fix-02-04: Improve Rating UX

**Files to modify**:
- `src/components/review/ReviewCard.tsx`
- `src/components/review/BrowseCard.tsx` (在 ReviewSession.tsx 内)

**Changes**:
1. **Scheduled 模式**: 在未揭示状态时添加提示 "点击揭示后可评分"
2. **Browse 模式**: 添加可选的评分功能（用户可以选择是否启用 FSRS 调度）
   - 揭示后显示评分按钮
   - 评分后触发 FSRS 调度更新
   - 或添加提示 "当前为浏览模式，评分仅在今日复习中可用"
3. 考虑在 browse 模式也显示评分按钮，让用户可以主动复习并评分

**Implementation notes**:
- 需要讨论：browse 模式是否应该支持评分？
- 如果支持，需要修改 `handleBrowseNext` 为 `handleBrowseRate`

---

## Gap 6: 数据库迁移缺失

**Severity**: blocker
**Root Cause**: Drizzle migrations 未创建和应用，`transcriptions` 表不存在

### Fix-02-05: Create and Apply Database Migrations

**Files to create/modify**:
- `drizzle.config.ts` (verify configuration)
- `drizzle/migrations/` (generate)
- `.env.local` (verify DATABASE_URL)

**Changes**:
1. 确认 `drizzle.config.ts` 配置正确
2. 运行 `npx drizzle-kit generate` 生成 migration 文件
3. 运行 `npx drizzle-kit migrate` 应用 migrations 到 Supabase
4. 验证 `transcriptions` 表已创建

**Implementation notes**:
- 需要 `DATABASE_URL` 环境变量指向 Supabase Transaction pooler
- 格式：`postgresql://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
- 确认 `prepare: false` 已设置（已确认在 `src/db/index.ts` 中）

---

## Execution Order

由于 gaps 之间有依赖关系，建议按以下顺序执行：

1. **Fix-02-05** (Database) - 必须先解决，否则转写功能完全不可用
2. **Fix-02-01** (Domain Sidebar) - 影响知识库核心体验
3. **Fix-02-03** (Browse Domain Filter) - 影响复习体验
4. **Fix-02-04** (Rating UX) - 影响复习体验
5. **Fix-02-02** (Delete Dialog) - 视觉改进，可最后做

---

## Verification Criteria

每个修复完成后，验证以下场景：

| Fix | Verification |
|-----|-------------|
| 02-05 | 转写 API 成功创建数据库记录，无 "Failed query" 错误 |
| 02-01 | 选择 domain 后 sidebar 仍显示所有 domains，正确项高亮 |
| 02-03 | Browse 模式下可选择特定 domain，只显示该 domain 的卡片 |
| 02-04 | Scheduled 模式揭示后显示评分按钮；Browse 模式行为清晰 |
| 02-02 | 删除时显示自定义确认对话框，而非浏览器默认 confirm |

---

## Effort Estimate

| Fix | Estimated Effort |
|-----|-----------------|
| 02-05 Database migrations | 30 min (需要环境变量配置) |
| 02-01 Domain sidebar | 1-2 hours |
| 02-03 Browse domain filter | 1 hour |
| 02-04 Rating UX | 1-2 hours (需要产品决策) |
| 02-02 Delete dialog | 30 min - 1 hour |

**Total**: ~4-6 hours
