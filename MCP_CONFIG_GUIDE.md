# Cloudflare MCP 配置指南

> 本文档介绍如何配置 Cloudflare MCP 服务器

## ✅ 已完成的配置

我已为您创建了以下配置文件：

### 1. Claude Desktop 配置
**路径**: `%APPDATA%\Claude\claude_desktop_config.json`
**完整路径**: `C:\Users\郑\AppData\Roaming\Claude\claude_desktop_config.json`

### 2. Cursor 配置
**路径**: `%USERPROFILE%\.cursor\mcp.json`
**完整路径**: `C:\Users\郑\.cursor\mcp.json`

---

## 🚀 使用步骤

### 步骤 1: 安装 mcp-remote

```bash
npm install -g mcp-remote
```

或者使用 npx（无需全局安装）

### 步骤 2: 重启您的 MCP 客户端

根据您使用的客户端，重启后配置生效：

| 客户端 | 重启方式 |
|--------|----------|
| **Claude Desktop** | 完全关闭应用，重新打开 |
| **Cursor** | 重启 Cursor 编辑器 |
| **Claude Code** | 退出并重新运行 `claude` |

### 步骤 3: OAuth 授权

重启后，会弹出浏览器窗口要求您：
1. 登录 Cloudflare 账号
2. 授权 MCP 访问您的 Workers 资源

点击 **Allow** 完成授权。

---

## 🛠️ 可用工具

配置完成后，您可以向 Claude/Cursor 发送以下指令：

### Workers 管理
```
列出我的所有 Workers
```

```
部署 voice-to-text-02 到 Cloudflare
```

```
查看 voice-to-text-02 的日志
```

### KV 存储管理
```
列出我的 KV Namespaces
```

```
在 CACHE_KV 中设置 key=test value=hello
```

### R2 存储管理
```
列出我的 R2 Buckets
```

```
上传文件到 voice-to-text-storage bucket
```

### D1 数据库
```
列出我的 D1 数据库
```

```
在 voice-to-text-db 中执行 SQL: SELECT * FROM users
```

---

## 📋 配置文件说明

### 已配置的服务器

| 服务器名称 | 用途 | 端点 |
|-----------|------|------|
| `cloudflare-workers` | 管理 Workers、KV、R2、D1 | `https://bindings.mcp.cloudflare.com/mcp` |
| `cloudflare-docs` | 查询官方文档 | `https://docs.mcp.cloudflare.com/mcp` |

---

## 🔧 手动配置其他客户端

### Claude Code (命令行)

```bash
# 添加 Workers MCP
claude mcp add cloudflare-workers -c "npx mcp-remote https://bindings.mcp.cloudflare.com/mcp"

# 添加 Docs MCP
claude mcp add cloudflare-docs -c "npx mcp-remote https://docs.mcp.cloudflare.com/mcp"
```

### 自定义 MCP 客户端

在配置文件中添加：

```json
{
  "mcpServers": {
    "cloudflare-workers": {
      "command": "npx",
      "args": ["mcp-remote", "https://bindings.mcp.cloudflare.com/mcp"]
    }
  }
}
```

---

## ❓ 故障排除

### 问题 1: "command not found: npx"

**解决**: 安装 Node.js：https://nodejs.org/

### 问题 2: OAuth 窗口没有弹出

**解决**: 
1. 检查网络连接
2. 确保没有广告拦截器阻止弹出窗口
3. 手动访问 https://dash.cloudflare.com 确认登录状态

### 问题 3: "Unauthorized" 错误

**解决**:
1. 删除配置文件重新配置
2. 在 Cloudflare Dashboard → My Profile → API Tokens 中撤销访问
3. 重新授权

### 问题 4: MCP 工具不显示

**解决**:
1. 完全关闭并重新打开客户端
2. 检查配置文件语法是否正确
3. 查看客户端的 MCP/Extensions 设置页面

---

## 🎯 下一步

配置完成后，尝试以下命令测试：

```
帮我列出 Cloudflare 上的所有 Workers
```

```
部署 voice-to-text-02 项目到生产环境
```

```
查看 voice-to-text-02 Workers 的实时日志
```

---

*配置时间: 2026-03-21*
