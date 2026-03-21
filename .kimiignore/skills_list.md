# Kimi Code CLI 可用技能列表

本文档列出了 Kimi Code CLI 可用的所有技能（Skills），包含技能名称、基本描述以及使用场景。

---

## 1. agent-browser
- **路径**: `~/.agents/skills/agent-browser/SKILL.md`
- **描述**: 浏览器自动化 CLI，用于与网站交互、导航页面、填写表单、点击按钮、截图、提取数据、测试 Web 应用或自动化浏览器任务。
- **何时使用**: 
  - 需要打开网站、填写表单、点击按钮
  - 需要截图或抓取网页数据
  - 测试 Web 应用
  - 登录网站或自动化浏览器操作

---

## 2. building-ai-agent-on-cloudflare
- **路径**: `~/.agents/skills/building-ai-agent-on-cloudflare/SKILL.md`
- **描述**: 使用 Cloudflare Agents SDK 构建 AI 代理，支持状态管理、实时 WebSocket、定时任务、工具集成和聊天功能。
- **何时使用**:
  - 用户想要"构建代理"、"AI 代理"、"聊天代理"
  - 提到"Agents SDK"、"实时 AI"、"WebSocket AI"
  - 询问代理的状态管理、定时任务或工具调用

---

## 3. drizzle-orm
- **路径**: `~/.agents/skills/drizzle-orm/SKILL.md`
- **描述**: 用于 TypeScript 的类型安全 SQL ORM，零运行时开销。
- **何时使用**:
  - 编写或优化 TypeScript 数据库查询
  - 设计数据库 schema
  - 需要类型安全的数据库操作

---

## 4. elevenlabs-agents
- **路径**: `~/.agents/skills/elevenlabs-agents/SKILL.md`
- **描述**: 使用 ElevenLabs 平台构建对话式 AI 语音代理。支持 React、React Native 和 Swift SDK。
- **何时使用**:
  - 构建语音代理或 AI 电话系统
  - 排查 @11labs 已弃用包的问题
  - 解决 webhook 错误、CSP 违规、工具解析错误

---

## 5. find-skills
- **路径**: `~/.agents/skills/find-skills/SKILL.md`
- **描述**: 帮助用户发现和安装技能，当用户询问"如何做 X"、"查找 X 的技能"或表达想要扩展功能的兴趣时使用。
- **何时使用**:
  - 用户问"如何执行某操作"
  - 用户询问"是否有技能可以..."
  - 寻找特定功能的可安装技能

---

## 6. kimi-cli-help
- **路径**: `~/.agents/skills/kimi-cli-help/SKILL.md`
- **描述**: 回答 Kimi Code CLI 的使用、配置和故障排除问题。
- **何时使用**:
  - 用户询问 Kimi Code CLI 的安装、设置、配置
  - 斜杠命令、键盘快捷键、MCP 集成问题
  - 提供商、环境变量相关问题

---

## 7. next-best-practices
- **路径**: `~/.agents/skills/next-best-practices/SKILL.md`
- **描述**: Next.js 最佳实践，包括文件约定、RSC 边界、数据模式、异步 API、元数据、错误处理、路由处理器、图像/字体优化和打包。
- **何时使用**:
  - 编写或审查 Next.js 代码
  - 处理服务器组件 (RSC) 边界问题
  - 优化数据获取和路由处理

---

## 8. skill-creator
- **路径**: `~/.agents/skills/skill-creator/SKILL.md`
- **描述**: 创建有效技能的指南。当用户想要创建新技能（或更新现有技能）时使用。
- **何时使用**:
  - 用户想要创建扩展 Kimi 能力的新技能
  - 需要了解如何编写技能文档
  - 更新现有技能时

---

## 9. supabase-postgres-best-practices
- **路径**: `~/.agents/skills/supabase-postgres-best-practices/SKILL.md`
- **描述**: 来自 Supabase 的 Postgres 性能优化和最佳实践。
- **何时使用**:
  - 编写、审查或优化 Postgres 查询
  - 设计数据库 schema
  - 配置数据库性能参数

---

## 10. vercel-composition-patterns
- **路径**: `~/.agents/skills/vercel-composition-patterns/SKILL.md`
- **描述**: 可扩展的 React 组合模式。当处理布尔属性泛滥的组件重构或构建灵活的组件库时使用。
- **何时使用**:
  - 重构具有过多布尔属性的组件
  - 构建灵活的组件库
  - 设计可复用的 API
  - 使用复合组件、渲染 props 或上下文提供者

---

## 11. vercel-react-best-practices
- **路径**: `~/.agents/skills/vercel-react-best-practices/SKILL.md`
- **描述**: 来自 Vercel Engineering 的 React 和 Next.js 性能优化指南。
- **何时使用**:
  - 编写或审查 React/Next.js 代码
  - 优化组件性能
  - 处理数据获取和打包优化

---

## 12. web-design-guidelines
- **路径**: `~/.agents/skills/web-design-guidelines/SKILL.md`
- **描述**: 审查 UI 代码是否符合 Web 界面指南。
- **何时使用**:
  - 用户要求"审查我的 UI"
  - 检查可访问性 (accessibility)
  - 审计设计或审查 UX
  - 对照最佳实践检查网站

---

## 13. workers-best-practices
- **路径**: `~/.agents/skills/workers-best-practices/SKILL.md`
- **描述**: 审查和编写符合生产最佳实践的 Cloudflare Workers 代码。
- **何时使用**:
  - 编写新的 Workers 代码
  - 审查 Workers 代码
  - 配置 wrangler.jsonc
  - 检查常见的 Workers 反模式（流式、浮动 Promise、全局状态、密钥、绑定、可观测性）

---

## 14. wrangler
- **路径**: `~/.agents/skills/wrangler/SKILL.md`
- **描述**: Cloudflare Workers CLI，用于部署、开发和管理 Workers、KV、R2、D1、Vectorize、Hyperdrive、Workers AI、容器、队列、工作流、管道和密钥存储。
- **何时使用**:
  - 运行 wrangler 命令
  - 部署 Workers 到 Cloudflare
  - 管理 Workers 资源和配置

---

## 使用说明

每个技能都包含一个 `SKILL.md` 文件，其中包含详细的说明、指南、脚本和示例。在执行相关任务前，可以阅读对应技能的文档以获取最佳实践。

### 如何加载技能
当你需要某个技能时，可以直接告知我需要读取该技能的 SKILL.md 文件。例如：
- "请加载 next-best-practices 技能"
- "我需要使用 agent-browser 技能来测试网页"

---

*文档生成时间: 2026-03-21*
*Kimi Code CLI 版本信息请使用 `/help` 查看*
