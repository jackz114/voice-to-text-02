#!/bin/bash
# 完全清理构建缓存脚本

echo "=== 清理构建缓存 ==="

# 删除 Next.js 和 OpenNext 构建输出
rm -rf .next
rm -rf .open-next
rm -rf dist

# 删除依赖缓存
rm -rf node_modules/.cache
rm -rf node_modules/.vite

# 删除 Wrangler 本地状态
rm -rf .wrangler/state

# 删除 lock 文件（可选，如果怀疑依赖解析问题）
# rm package-lock.json
# rm -rf node_modules
# npm install

echo "=== 缓存清理完成 ==="
echo "现在运行: npm run build:cloudflare"
