---
phase: 03
name: retention-engine
decisions: 12
last_updated: 2026-03-24
---

# Phase 03 Context: Retention Engine

基于 `/gsd:discuss-phase 3` 讨论总结，为 Phase 03（提醒通知 + 自然语言搜索）的规划和执行提供决策依据。

---

## 领域一：通知策略 (Notification Strategy)

### D-01: 邮件触发时机 — 用户自定义时间
**决策**：用户可在设置中自定义每日提醒时间（如早上 9:00），而非系统固定时间或智能推算。

**理由**：
- 用户最了解自己的作息规律
- 避免在睡眠或工作时间打扰
- 实现简单，无需复杂的行为分析

### D-02: 退订管理 — 细粒度控制
**决策**：提供两层控制：
1. 全局开关：完全关闭邮件提醒
2. 按领域过滤：只接收特定领域的提醒（如只接收"计算机科学"，屏蔽"心理学"）

**理由**：
- 避免"一刀切"退订导致功能废弃
- 不同领域的复习密度差异大，用户可能只想关注核心领域

---

## 领域二：搜索实现 (Search Implementation)

### D-03: 搜索技术 — PostgreSQL 混合搜索 (Hybrid Search)
**决策**：同时预埋全文搜索 (tsvector) 和向量搜索 (pgvector) 基础设施，Phase 3 优先使用全文搜索。

**技术方案**：
```sql
-- 表结构（创建知识条目时同步生成）
ALTER TABLE knowledge_items ADD COLUMN search_vector tsvector;
ALTER TABLE knowledge_items ADD COLUMN embedding vector(1536); -- 预埋

-- 全文搜索索引
CREATE INDEX idx_knowledge_search ON knowledge_items USING GIN(search_vector);

-- 向量搜索索引（预埋，Phase 4 启用）
CREATE INDEX idx_knowledge_embedding ON knowledge_items USING ivfflat(embedding vector_cosine_ops);
```

**实施策略**：
- **Phase 3 (当前)**：tsvector 全文搜索，标题权重 A，内容权重 B，标签权重 A
- **Phase 4 (预留)**：开启 embedding 生成，使用 RRF 算法融合全文 + 向量结果

**理由**：
- PostgreSQL 是唯一能在一个数据库内完美支持两种搜索的系统
- 提前存储 embedding 避免历史数据回刷成本
- 零额外基础设施依赖

### D-04: 搜索界面位置 — 全局入口 + 上下文过滤
**决策**：
1. **全局搜索**：任意页面按 `Cmd+K` 唤起浮层搜索
2. **知识库内搜索**：列表页顶部搜索框，仅过滤当前视图
3. **独立搜索页**：`/search`，提供高级筛选（多标签、日期范围、来源类型）

**触发逻辑**：
- 浮层搜索显示前 5 条结果 + "查看全部结果"按钮
- 点击"查看全部"跳转 `/search`

### D-05: 搜索范围与权重
**决策**：全字段搜索，按权重排序结果：

| 字段 | 权重 | 说明 |
|------|------|------|
| 标题 (title) | A (最高) | 命中即优先展示 |
| 标签 (tags) | A (最高) | 直接匹配标签名 |
| 内容 (content) | B (中等) | 全文匹配 |
| 来源 (source) | C (低) | 仅域名/路径匹配 |
| 领域 (domain) | 过滤条件 | 不作为全文匹配对象 |

**结果显示**：标题、智能摘要（`ts_headline` 高亮）、标签云、归属信息、来源标识、更新时间

---

## 领域三：通知内容设计 (Notification Content Design)

### D-06: 邮件模板策略 — 轻量级 HTML
**决策**：使用内联 CSS 的响应式 HTML 邮件，同时包含 `multipart/alternative` 纯文本备选。

**实施规范**：
- 内联样式（`<p style="color: #333;">`），禁止外部样式表
- 响应式设计：移动端卡片堆叠，按钮 `min-height: 44px`
- 暗色模式适配：使用 `prefers-color-scheme` 媒体查询
- 纯文本备选：用于极端客户端兼容性和垃圾邮件评分优化

### D-07: 内容摘要策略 — 标题 + 状态，隐藏内容
**决策**：邮件显示标题预览、领域标签、FSRS 状态可视化，**绝不显示具体内容片段**。

**展示内容**：
- ✅ 标题（加粗）
- ✅ 领域/标签（小徽章样式：如 `[前端]` `[Hooks]`）
- ✅ FSRS 状态（直观图标）：
  - 🔴 过期/紧急（显示"已过期 X 天"）
  - 🟡 今日待复习
  - 🟢 新学知识
- ❌ 具体内容片段（防止破坏主动回忆机制）

**列表限制**：最多展示 5-10 条最紧急条目，超出显示"还有 X 条待复习..."

### D-08: CTA 设计 — Deep Link 直达复习流
**决策**：主按钮直接跳转 `/review?session=daily&source=email`，而非列表页或邮件内评分。

**按钮文案**：
- 主 CTA：`🚀 立即开始复习` / `Start Review`
- 次要链接：`暂停今日提醒` | `调整复习设置`

**技术方案**：
```
https://bijiassistant.shop/review?session=daily&source=email
```
- 已登录用户：直接展示第一张卡片
- 未登录用户：跳转登录页，成功后重定向回复习页

### D-09: 个性化称呼策略
**决策**：三级回退策略：
1. Level 1 (优先)：用户设置的用户名（如 "Hi Alex,"）
2. Level 2 (备选)：邮箱 @ 前缀格式化（`alex_smith` → `Alex Smith`）
3. Level 3 (兜底)：中性称呼（`Hi there,` / `Hello Learner,`）

**语气风格**：鼓励性、伙伴式，避免命令式
- ✅ 好："Alex，你有 5 个知识点正在等待加固，花 3 分钟搞定它们吧！"
- ❌ 坏："用户，你今天的复习任务未完成，请立即处理。"

---

## 领域四：搜索体验 (Search UX)

### D-10: 搜索结果交互 — 抽屉/模态框
**决策**：点击结果后在当前页右侧滑出详情抽屉（桌面端占 40-50% 宽度）或居中模态框，**禁止跳转到独立页面**。

**交互细节**：
- 桌面端：右侧抽屉，左侧保留搜索列表便于对比
- 移动端：全屏模态框，顶部保留关闭按钮
- 关闭方式：点击遮罩层、按 ESC、点击 X
- 关闭后焦点自动回归搜索框

### D-11: 搜索空状态设计 — 指路牌模式
**决策**：零结果时不显示简单"未找到"，而是提供三层引导：

1. **明确反馈**："没找到关于 '{query}' 的确切匹配"
2. **可操作的建议**：
   - "试试更简单的关键词"
   - "检查拼写或尝试同义词"
   - "清除筛选条件"按钮
3. **替代路径**：
   - 相关领域推荐（如搜"Redux"推荐"[前端开发] 领域"）
   - 热门标签展示
   - "创建新笔记"入口（预填搜索词为标题）

### D-12: 搜索历史 — 智能辅助
**决策**：保存最近 5-8 条搜索历史，按以下规则展示：

**触发时机**：点击搜索框但未输入字符时显示，输入开始后隐藏转为实时结果

**管理功能**：
- 单条删除：悬停显示 × 按钮
- 一键清空：列表底部提供"清除所有历史记录"
- 隐私开关："不在本设备保存搜索历史"
- 智能推荐：基于历史推荐相关标签

### D-13: 快捷键映射 — 键盘优先
**决策**：实现全键盘无障碍导航：

| 按键 | 行为 | 场景 |
|------|------|------|
| `Cmd/Ctrl + K` | 全局唤起/聚焦搜索 | 任意页面 |
| `ESC` | 关闭搜索，焦点回归页面 | 搜索打开时 |
| `↓ / ↑` | 在结果间导航高亮 | 有结果时 |
| `Enter` | 打开高亮结果（模态框） | 选中结果时 |
| `Cmd/Ctrl + Enter` | 新标签页打开结果 | 选中结果时 |

**移动端手势**：下拉唤起搜索（类似 iOS Spotlight），下滑关闭模态框

### D-14: 实时搜索 — Debounce 300ms
**决策**：输入即搜模式，防抖延迟 300-400ms。

**技术规范**：
- 防抖时间：300ms（平衡响应速度与服务器压力）
- 最少字符：2-3 个字符后开始搜索（避免单字返回海量结果）
- 加载状态：搜索框内显示微小 Loading 图标或骨架屏
- 结果动画：淡入 (Fade-in) 避免列表跳动

---

## Code Context

### 数据库 Schema 预埋（需在 Phase 3 规划时创建）

```typescript
// src/db/schema.ts 新增字段
export const knowledgeItems = pgTable("knowledge_items", {
  // ... 现有字段 ...

  // 全文搜索向量（Phase 3 使用）
  searchVector: tsvector("search_vector"),

  // 语义搜索向量（Phase 3 预埋，Phase 4 启用）
  embedding: vector("embedding", { dimensions: 1536 }),
});

// 索引
export const knowledgeItemsSearchIndex = index("knowledge_items_search_idx")
  .on(knowledgeItems.searchVector)
  .using("gin");

export const knowledgeItemsEmbeddingIndex = index("knowledge_items_embedding_idx")
  .on(knowledgeItems.embedding)
  .using("ivfflat", "vector_cosine_ops");
```

### 依赖清单

**新增依赖**：
- `resend` - 邮件发送 SDK（已提及在 STATE.md）
- `openai` - 用于生成 embedding（Phase 3 预埋，Phase 4 启用）

**无需新增**：
- 搜索基础设施复用现有 PostgreSQL
- 无需 Elasticsearch、Meilisearch 等外部搜索服务

### API 路由规划

```
POST /api/notifications/send-daily    # 发送每日提醒（Cron 触发）
GET  /api/notifications/preferences   # 获取通知偏好设置
POST /api/notifications/preferences   # 更新通知偏好设置
GET  /api/search?q=xxx&domain=xxx     # 全文搜索接口
POST /api/search/semantic             # 语义搜索接口（Phase 4 启用）
```

### 组件规划

```
src/components/search/
  ├── SearchTrigger.tsx          # Cmd+K 触发器
  ├── SearchModal.tsx            # 搜索浮层/模态框
  ├── SearchResults.tsx          # 搜索结果列表
  ├── SearchEmptyState.tsx       # 空状态组件
  ├── SearchHistory.tsx          # 搜索历史下拉
  └── ResultDetailDrawer.tsx     # 详情抽屉

src/components/notifications/
  ├── DailyReminderEmail.tsx     # 邮件模板组件
  ├── NotificationPreferences.tsx # 偏好设置 UI
  └── UnsubscribeHandler.tsx     # 退订处理
```

---

## Deferred Ideas (暂存，未来阶段考虑)

以下想法超出 Phase 3 范围，但值得记录供后续规划参考：

1. **智能提醒时间**：基于用户历史活跃时间推算最佳提醒时机（需用户行为分析基础设施）
2. **多渠道通知**：短信、App Push、Slack/Discord Bot（目前仅邮件）
3. **AI 生成复习总结**：每周/每月生成学习报告，分析复习效率和知识掌握度
4. **协作搜索**：搜索时显示"你的好友也在关注此主题"（社交功能）
5. **语音搜索**：在移动端支持语音输入搜索词

---

*Context created: 2026-03-24*
*Source: /gsd:discuss-phase 3*
*Decisions: 14*
