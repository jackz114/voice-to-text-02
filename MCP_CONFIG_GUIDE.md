# MCP 配置指南

> 本文档说明 Kimi Code CLI 的 MCP 配置

## 📁 配置文件位置

**路径**: `C:\Users\郑\.kimi\mcp.json`

## 🛠️ 已配置的 MCP 服务器

| 服务器 | 用途 | 安装方式 |
|--------|------|----------|
| `playwright` | 浏览器自动化测试 | `npx @executeautomation/playwright-mcp-server` |
| `github` | GitHub API 操作 | `npx @anthropic-ai/github-mcp-server` |
| `supabase` | Supabase 数据库管理 | `npx @supabase/mcp-server-supabase` |
| `context7` | 文档搜索 | `npx @upstash/context7-mcp` |
| `cloudflare-workers` | Workers/KV/R2/D1 管理 | `npx mcp-remote https://bindings.mcp.cloudflare.com/mcp` |
| `cloudflare-docs` | Cloudflare 文档查询 | `npx mcp-remote https://docs.mcp.cloudflare.com/mcp` |

---

## 🔧 环境变量

部分 MCP 需要环境变量：

```bash
# GitHub
GITHUB_TOKEN=your_github_token

# Supabase
SUPABASE_ACCESS_TOKEN=your_supabase_token
```

---

## 🚀 使用示例

```
用 Playwright 打开网页并截图
```

```
搜索 GitHub 上的 voice-to-text 仓库
```

```
查询 Supabase 数据库中的 users 表
```

```
用 Context7 查询 Next.js 文档
```

```
列出我的 Cloudflare Workers
```

---

*配置时间: 2026-03-21*
