# Cloudflare Workers 部署指南

> 本文档介绍如何将 Voice to Text 应用部署到 Cloudflare Workers

## 📋 前置要求

- [Cloudflare](https://dash.cloudflare.com) 账号
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) 已安装
- 域名 `bijiassistant.shop` 已添加到 Cloudflare

---

## 🔧 第一步：安装依赖

```bash
# 确保已安装 wrangler
npm install -D wrangler@latest

# 安装 Cloudflare 适配器
npm install @opennextjs/cloudflare
```

---

## 🔐 第二步：登录 Cloudflare

```bash
# 登录 Wrangler
npx wrangler login

# 验证登录
npx wrangler whoami
```

---

## 📦 第三步：创建 Cloudflare 资源

### 1. 创建 KV Namespace（缓存）

```bash
npx wrangler kv namespace create "CACHE_KV"
```

输出示例：
```
🌀 Creating namespace with title "voice-to-text-02-CACHE_KV"
✨ Success!
Add the following to your wrangler.jsonc configuration file:
{
  "kv_namespaces": [
    {
      "binding": "CACHE_KV",
      "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  ]
}
```

**复制输出的 `id` 到 `wrangler.jsonc` 中**

### 2. 创建 R2 Bucket（文件存储）

```bash
npx wrangler r2 bucket create voice-to-text-storage
```

### 3. 设置自定义域名

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages**
2. 点击 **voice-to-text-02**
3. 选择 **Triggers** → **Custom Domains**
4. 添加域名：`bijiassistant.shop` 和 `www.bijiassistant.shop`

---

## 🔑 第四步：设置环境变量

### 方法 1：使用 Wrangler Secret（推荐）

```bash
# Supabase 配置
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
# 输入: https://fpwstkjcatajbidwtugy.supabase.co

npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
# 输入: your_anon_key

npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# 输入: your_service_role_key

# PayPal 配置
npx wrangler secret put PAYPAL_CLIENT_SECRET
# 输入: ECRiKiitBC08VnHSfzMgqUaYkXBjd0Z058ZUAG8WU4yiz2YZWuOjiZrofccqpekM4X7m7QcIHSJVrf2M

npx wrangler secret put PAYPAL_WEBHOOK_ID
# 输入: 4FB588016G832925R
```

### 方法 2：批量设置（使用 JSON 文件）

创建 `secrets.json`：

```json
{
  "NEXT_PUBLIC_SUPABASE_URL": "https://fpwstkjcatajbidwtugy.supabase.co",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your_anon_key",
  "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key",
  "PAYPAL_CLIENT_SECRET": "ECRiKiitBC08VnHSfzMgqUaYkXBjd0Z058ZUAG8WU4yiz2YZWuOjiZrofccqpekM4X7m7QcIHSJVrf2M",
  "PAYPAL_WEBHOOK_ID": "4FB588016G832925R"
}
```

然后执行：
```bash
npx wrangler secret bulk secrets.json
```

**注意：** 设置完成后删除 `secrets.json` 文件！

---

## 🚀 第五步：构建和部署

### 本地开发

```bash
# 启动本地开发服务器
npx wrangler dev

# 访问 http://localhost:8787
```

### 生产部署

```bash
# 构建 Next.js 应用
npm run build

# 使用 OpenNext 构建 Cloudflare 版本
npx open-next@latest build

# 部署到 Cloudflare
npx wrangler deploy
```

### 部署到特定环境

```bash
# 部署到 staging
npx wrangler deploy --env staging

# 部署到 production（默认）
npx wrangler deploy --env production
```

---

## 📊 第六步：验证部署

### 检查部署状态

```bash
# 查看 Workers 列表
npx wrangler list

# 查看实时日志
npx wrangler tail

# 检查配置
npx wrangler check
```

### 测试端点

```bash
# 测试首页
curl https://bijiassistant.shop

# 测试 PayPal Webhook
curl -X POST https://bijiassistant.shop/api/paypal/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🔄 第七步：配置 CI/CD（GitHub Actions）

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Build for Cloudflare
        run: npx open-next@latest build

      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

### 设置 GitHub Secrets

在 GitHub 仓库设置中添加：
- `CLOUDFLARE_API_TOKEN` - 从 Cloudflare Dashboard → My Profile → API Tokens 创建

---

## 🛠️ 故障排除

### 常见问题

#### 1. 构建失败

```bash
# 清理构建缓存
rm -rf .open-next .next

# 重新构建
npm run build
npx open-next@latest build
```

#### 2. KV Namespace 未找到

```bash
# 检查 KV 命名空间
npx wrangler kv namespace list

# 更新 wrangler.jsonc 中的 id
```

#### 3. 域名未生效

- 确保域名 DNS 已指向 Cloudflare
- 在 Cloudflare Dashboard 中添加 Custom Domain
- 等待 SSL 证书颁发（通常 1-5 分钟）

#### 4. 环境变量未生效

```bash
# 检查 secrets
npx wrangler secret list

# 重新设置
npx wrangler secret put KEY_NAME
```

---

## 📈 性能优化

### 1. 启用缓存

已在 `wrangler.jsonc` 中配置 KV 缓存，无需额外操作。

### 2. 图片优化

使用 Cloudflare Images（可选）：

```jsonc
// wrangler.jsonc
{
  "images": {
    "binding": "IMAGES"
  }
}
```

### 3. 边缘缓存

在 `_routes.json` 中配置（自动生成的 `.open-next` 已包含）

---

## 🔒 安全建议

1. **不要在代码中提交密钥** - 使用 Wrangler Secrets
2. **定期轮换密钥** - PayPal 和 Supabase 密钥
3. **启用 Webhook 签名验证** - 已配置 `PAYPAL_WEBHOOK_ID`
4. **使用 HTTPS** - Cloudflare 自动提供 SSL

---

## 📚 参考文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

---

*最后更新: 2026-03-21*
