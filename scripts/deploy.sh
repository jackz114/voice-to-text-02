#!/bin/bash

# ========================================
# 部署脚本
# ========================================

echo "========================================"
echo "部署到 Cloudflare Workers"
echo "========================================"
echo ""

# 检查构建
echo "检查构建输出..."
if [ ! -d ".open-next" ]; then
    echo "❌ 未找到 .open-next 目录，请先运行构建"
    exit 1
fi

if [ ! -f ".open-next/worker.js" ]; then
    echo "❌ 未找到 worker.js，请先运行构建"
    exit 1
fi

echo "✓ 构建输出检查通过"
echo ""

# 部署
echo "开始部署..."
npx opennextjs-cloudflare deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✅ 部署成功!"
    echo "========================================"
    echo ""
    echo "查看日志: npx wrangler tail"
    echo ""
else
    echo ""
    echo "========================================"
    echo "❌ 部署失败"
    echo "========================================"
    exit 1
fi
