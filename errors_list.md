# 部署错误总结 - 2026-03-26

## 一、Cloudflare Workers 运行时错误

### 1. node:fs 模块不存在错误
**错误信息**：
```
Uncaught Error: No such module "node:fs"
  imported from "node-modules-drizzle-orm-migrator-js-4ce508.js"
  code: 10021
```

**根本原因**：
- `drizzle-orm/pg-core` 是 Node.js 专用的库，内部依赖 `node:fs` 等内置模块
- Cloudflare Workers 不支持文件系统 API (`node:fs`)
- `nodejs_compat_v2` 兼容标志支持 `Buffer`、`crypto` 等，但**不支持 `fs`**

**修复过程**：
1. ❌ 尝试使用 webpack DefinePlugin 禁用调试代码 - 无效
2. ❌ 尝试使用 webpack resolve.alias 重定向 node: 模块到空模块 - 无效（OpenNext 构建不遵循 webpack 配置）
3. ✅ 将 `schema.ts` 从 `src/db/` 移到 `scripts/` 目录（仅在 drizzle-kit 迁移时使用）
4. ✅ 在 `next.config.ts` 中添加 webpack externals 排除 `drizzle-orm`

**最终解决方案**：
- 分离 Drizzle ORM schema 文件，确保不被 Next.js 构建打包
- 运行时数据库操作改用 Supabase REST API

---

## 二、TypeScript 类型错误

### 2. open-next.config.ts 配置错误
**错误信息**：
```
./open-next.config.ts:5:3
Type error: Object literal may only specify known properties,
and 'externals' does not exist in type 'CloudflareOverrides'.
```

**错误原因**：
- 误以为 `defineCloudflareConfig` 支持 `externals` 属性
- 该属性不存在于 `CloudflareOverrides` 类型定义中

**修复方案**：
- 移除 `open-next.config.ts` 中的 `externals` 配置
- 保留空的 `defineCloudflareConfig()` 调用

---

## 三、构建配置错误

### 3. GitHub Actions 部署失败
**现象**：
- 多次部署尝试均失败（连续 5+ 次 failure）

**问题排查**：
1. 清理缓存步骤正常执行（删除 `.next`, `.open-next`, `.wrangler`, `wrangler.toml`）
2. `npm ci` 安装依赖成功
3. `opennextjs-cloudflare build` 在 TypeScript 检查阶段失败

**根本原因链**：
```
GitHub Actions 触发
  → opennextjs-cloudflare build
    → npm run build
      → next build --webpack
        → TypeScript 类型检查
          → open-next.config.ts 类型错误
            → 构建失败
```

---

## 四、错误的解决方案尝试（无效）

### 4.1 webpack resolve.alias
```typescript
config.resolve.alias = {
  "node:fs": "@/lib/empty-module.ts",
  "node:util": "@/lib/empty-module.ts",
  // ...
};
```
**结果**：❌ 无效，OpenNext 构建过程不遵循 webpack 的 resolve.alias

### 4.2 open-next.config.ts externals
```typescript
export default defineCloudflareConfig({
  externals: ["drizzle-orm", ...],  // 不支持的属性
});
```
**结果**：❌ 类型错误，该属性不存在

---

## 五、经验总结

### 关键认知
1. **Cloudflare Workers ≠ Node.js**：Workers 是 V8 隔离环境，没有文件系统访问能力
2. **OpenNext 构建独立于 webpack**：webpack 配置仅影响 Next.js 客户端/服务端打包，不影响最终的 Worker bundle
3. **drizzle-orm/pg-core 仅适用于 Node.js**：在 Workers 环境中应使用 Supabase REST API 替代

### 最佳实践
- 数据库 schema 文件应放在 `scripts/` 等非源码目录，避免被 Next.js 自动导入
- 在 Cloudflare Workers 中使用 Supabase 时，优先使用 REST API 而非 postgres 驱动
- 遇到 `node:` 前缀的模块错误，应寻找纯 JavaScript 替代方案

### 调试技巧
- 查看 GitHub Actions 完整日志：`gh run view <ID> --log`
- 本地构建测试：`npm run build:cloudflare`（如有 Linux/Mac 环境）
- 类型检查：`npx tsc --noEmit`
