# Cloudflare Workers 自动监控指南

> 使用 MCP 自动监控 Workers 部署状态和性能指标

## 🔭 新添加的监控 MCP

| MCP 服务器 | 用途 | 端点 |
|-----------|------|------|
| `cloudflare-observability` | **实时监控** Workers 日志、错误、性能指标 | `https://observability.mcp.cloudflare.com/mcp` |
| `cloudflare-builds` | **构建状态** 查看部署进度、构建日志 | `https://builds.mcp.cloudflare.com/mcp` |
| `cloudflare-workers` | **资源管理** Workers/KV/R2/D1 管理 | `https://bindings.mcp.cloudflare.com/mcp` |

---

## 🚀 自动监控使用示例

### 1. 实时查看 Workers 日志

```
查看 voice-to-text-02 Workers 最近 1 小时的日志
```

```
分析 voice-to-text-02 的错误率和性能指标
```

### 2. 监控部署状态

```
查看 voice-to-text-02 的最新构建状态
```

```
获取 voice-to-text-02 的部署日志和构建历史
```

### 3. 性能监控

```
检查 voice-to-text-02 的 CPU 和内存使用情况
```

```
分析 voice-to-text-02 的请求延迟分布
```

### 4. 错误追踪

```
查找 voice-to-text-02 最近的 500 错误
```

```
统计 voice-to-text-02 今天的错误数量
```

---

## 📊 可用的监控工具

### Observability MCP 工具

| 工具 | 功能 |
|------|------|
| `workers_observability_query` | 查询 Workers 日志和指标 |
| `workers_observability_schema` | 查看可用的日志字段 |
| `workers_observability_values` | 探索字段值（用于过滤） |

### Builds MCP 工具

| 工具 | 功能 |
|------|------|
| `workers_builds_list_builds` | 列出所有构建 |
| `workers_builds_get_build` | 获取特定构建详情 |
| `workers_builds_get_build_logs` | 获取构建日志 |
| `workers_builds_set_active_worker` | 设置当前 Worker |

---

## 🔧 自动化监控场景

### 场景 1：部署后自动检查

```
帮我部署 voice-to-text-02，然后监控部署状态直到完成
```

### 场景 2：错误告警

```
监控 voice-to-text-02，如果错误率超过 1% 就告诉我
```

### 场景 3：性能分析

```
分析 voice-to-text-02 过去 24 小时的性能趋势
```

### 场景 4：日志搜索

```
在 voice-to-text-02 的日志中搜索所有包含 "PayPal" 的请求
```

---

## 📝 配置检查清单

- [x] `cloudflare-observability` - 日志和指标监控
- [x] `cloudflare-builds` - 构建和部署状态
- [x] `cloudflare-workers` - Workers 资源管理
- [x] `cloudflare-docs` - 文档查询

**重启 Kimi Code CLI 后生效！**

---

## 💡 高级用法

### 结合多个 MCP

```
用 GitHub Actions 部署 voice-to-text-02，
然后用 Cloudflare Builds MCP 监控部署状态，
部署完成后用 Observability MCP 检查日志
```

### 自动化报告

```
生成 voice-to-text-02 的每日健康报告，
包括：请求量、错误率、平均延迟、Top 10 错误
```

---

*更新时间: 2026-03-21*
