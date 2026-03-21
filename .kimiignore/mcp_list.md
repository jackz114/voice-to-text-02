# Kimi Code CLI 可用 MCP 服务器列表

本文档列出了 Kimi Code CLI 可用的所有 MCP (Model Context Protocol) 服务器及其工具，包含服务器名称、描述以及每个工具的详细说明。

---

## 1. GitHub MCP Server (`github`)

用于与 GitHub API 交互的 MCP 服务器，支持仓库管理、Issue、PR、代码搜索等操作。

### 1.1 仓库管理

| 工具名称 | 描述 |
|----------|------|
| `search_repositories` | 搜索 GitHub 仓库 |
| `fork_repository` | Fork 仓库到指定账户或组织 |
| `create_repository` | 创建新仓库 |

### 1.2 文件操作

| 工具名称 | 描述 |
|----------|------|
| `get_file_contents` | 获取仓库中文件或目录的内容 |
| `create_or_update_file` | 创建或更新单个文件 |
| `push_files` | 推送多个文件到仓库（单次提交） |

### 1.3 Issue 管理

| 工具名称 | 描述 |
|----------|------|
| `list_issues` | 列出仓库中的 Issue（支持过滤） |
| `get_issue` | 获取特定 Issue 的详细信息 |
| `create_issue` | 创建新 Issue |
| `update_issue` | 更新现有 Issue |
| `add_issue_comment` | 为 Issue 添加评论 |
| `search_issues` | 搜索 Issue 和 PR |

### 1.4 Pull Request 管理

| 工具名称 | 描述 |
|----------|------|
| `list_pull_requests` | 列出仓库中的 PR |
| `get_pull_request` | 获取特定 PR 的详细信息 |
| `create_pull_request` | 创建新 PR |
| `update_pull_request_branch` | 将 PR 分支更新到最新基分支 |
| `get_pull_request_files` | 获取 PR 中更改的文件列表 |
| `get_pull_request_status` | 获取 PR 状态检查的合并状态 |
| `get_pull_request_comments` | 获取 PR 的评论 |
| `get_pull_request_reviews` | 获取 PR 的审查 |
| `create_pull_request_review` | 创建 PR 审查 |
| `merge_pull_request` | 合并 PR |

### 1.5 代码搜索

| 工具名称 | 描述 |
|----------|------|
| `search_code` | 跨仓库搜索代码 |
| `search_users` | 搜索 GitHub 用户 |

### 1.6 提交历史

| 工具名称 | 描述 |
|----------|------|
| `list_commits` | 获取分支的提交列表 |

---

## 2. Supabase MCP Server (`supabase`)

用于与 Supabase 后端服务交互的 MCP 服务器，支持项目管理、数据库操作、Edge Functions 等。

### 2.1 文档查询

| 工具名称 | 描述 |
|----------|------|
| `search_docs` | 使用 GraphQL 搜索 Supabase 文档 |

### 2.2 组织管理

| 工具名称 | 描述 |
|----------|------|
| `list_organizations` | 列出用户所属的所有组织 |
| `get_organization` | 获取组织详情（包括订阅计划） |

### 2.3 项目管理

| 工具名称 | 描述 |
|----------|------|
| `list_projects` | 列出所有 Supabase 项目 |
| `get_project` | 获取项目详情 |
| `get_cost` | 获取创建项目或分支的成本 |
| `confirm_cost` | 确认用户理解创建成本 |
| `create_project` | 创建新 Supabase 项目 |
| `pause_project` | 暂停项目 |
| `restore_project` | 恢复项目 |

### 2.4 分支管理

| 工具名称 | 描述 |
|----------|------|
| `list_branches` | 列出项目的开发分支 |
| `create_branch` | 创建开发分支 |
| `delete_branch` | 删除开发分支 |
| `merge_branch` | 将分支合并到生产环境 |
| `reset_branch` | 重置分支迁移 |
| `rebase_branch` | 将开发分支变基到生产环境 |

### 2.5 数据库操作

| 工具名称 | 描述 |
|----------|------|
| `list_tables` | 列出指定 schema 中的所有表 |
| `list_extensions` | 列出数据库中的所有扩展 |
| `list_migrations` | 列出数据库中的所有迁移 |
| `apply_migration` | 应用迁移（DDL 操作） |
| `execute_sql` | 执行原始 SQL 查询 |

### 2.6 开发者工具

| 工具名称 | 描述 |
|----------|------|
| `get_project_url` | 获取项目 API URL |
| `get_publishable_keys` | 获取项目的可发布 API 密钥 |
| `generate_typescript_types` | 为项目生成 TypeScript 类型 |
| `get_logs` | 获取项目日志（支持多种服务类型） |
| `get_advisors` | 获取项目的建议通知（安全/性能） |

### 2.7 Edge Functions

| 工具名称 | 描述 |
|----------|------|
| `list_edge_functions` | 列出项目中的所有 Edge Functions |
| `get_edge_function` | 获取 Edge Function 文件内容 |
| `deploy_edge_function` | 部署 Edge Function |

---

## 3. Playwright MCP Server (`playwright`)

用于浏览器自动化和测试的 MCP 服务器，支持页面导航、元素交互、截图等功能。

### 3.1 浏览器控制

| 工具名称 | 描述 |
|----------|------|
| `browser_navigate` | 导航到指定 URL |
| `browser_navigate_back` | 返回上一页 |
| `browser_close` | 关闭页面 |
| `browser_resize` | 调整浏览器窗口大小 |
| `browser_tabs` | 列出、创建、关闭或选择标签页 |

### 3.2 页面交互

| 工具名称 | 描述 |
|----------|------|
| `browser_click` | 点击页面元素 |
| `browser_hover` | 悬停在元素上 |
| `browser_type` | 在可编辑元素中输入文本 |
| `browser_fill_form` | 填写多个表单字段 |
| `browser_select_option` | 在下拉框中选择选项 |
| `browser_drag` | 执行拖拽操作 |
| `browser_press_key` | 按下键盘按键 |

### 3.3 文件和对话框

| 工具名称 | 描述 |
|----------|------|
| `browser_file_upload` | 上传文件 |
| `browser_handle_dialog` | 处理对话框（确认/取消） |

### 3.4 页面信息

| 工具名称 | 描述 |
|----------|------|
| `browser_snapshot` | 捕获页面可访问性快照 |
| `browser_take_screenshot` | 截取屏幕截图 |
| `browser_wait_for` | 等待文本出现/消失或指定时间 |
| `browser_evaluate` | 在页面或元素上执行 JavaScript |
| `browser_run_code` | 运行 Playwright 代码片段 |

### 3.5 调试信息

| 工具名称 | 描述 |
|----------|------|
| `browser_console_messages` | 获取控制台消息 |
| `browser_network_requests` | 获取所有网络请求 |
| `browser_install` | 安装配置中指定的浏览器 |

---

## 4. Context7 MCP Server (`context7`)

用于获取编程库和框架的最新文档和代码示例的 MCP 服务器。

### 4.1 库解析

| 工具名称 | 描述 |
|----------|------|
| `resolve-library-id` | 将包/产品名称解析为 Context7 兼容的库 ID |

**重要提示**: 使用 `query-docs` 之前必须先调用此工具获取有效的库 ID（除非用户已提供格式为 `/org/project` 或 `/org/project/version` 的库 ID）。

### 4.2 文档查询

| 工具名称 | 描述 |
|----------|------|
| `query-docs` | 从 Context7 检索和查询最新文档及代码示例 |

**使用限制**: 每个问题最多调用 3 次，如果仍未找到需要的信息，使用已获得的最佳结果。

---

## 使用说明

### 如何调用 MCP 工具

MCP 工具通过特定的调用格式使用，例如：
- `github.search_repositories` - 搜索 GitHub 仓库
- `supabase.list_projects` - 列出 Supabase 项目
- `playwright.browser_navigate` - 浏览器导航
- `context7.resolve-library-id` - 解析库 ID

### 选择正确的 MCP 服务器

| 场景 | 推荐 MCP 服务器 |
|------|-----------------|
| GitHub 操作（代码、Issue、PR） | `github` |
| 数据库管理（Postgres、Supabase） | `supabase` |
| 浏览器自动化、测试、截图 | `playwright` |
| 查询编程库文档 | `context7` |

---

*文档生成时间: 2026-03-21*
*MCP 服务器配置可能随 Kimi Code CLI 版本更新而变化*
