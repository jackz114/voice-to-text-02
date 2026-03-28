#!/bin/bash

# ========================================
# 查找 node:fs 引用（用于排查问题）
# ========================================

echo "查找构建输出中的 node:fs 引用..."
echo ""

if [ ! -d ".open-next" ]; then
    echo "错误: 未找到 .open-next 目录，请先运行构建"
    exit 1
fi

echo "1. 搜索 node:fs 引用:"
grep -r "node:fs" .open-next --include="*.js" -n | head -20 || echo "未找到 node:fs"
echo ""

echo "2. 搜索 fs 模块引用:"
grep -r "require('fs')" .open-next --include="*.js" -n | head -20 || echo "未找到 require('fs')"
echo ""

echo "3. 搜索 path 模块引用:"
grep -r "node:path" .open-next --include="*.js" -n | head -20 || echo "未找到 node:path"
echo ""

echo "4. 查看 worker.js 大小:"
ls -lh .open-next/worker.js 2>/dev/null || echo "未找到 worker.js"
echo ""

echo "5. 检查 problematic packages:"
echo "  正在分析 bundle..."
cd .open-next/server-functions/default 2>/dev/null
if [ -f "handler.mjs" ]; then
    grep -o "from ['\"]\\.[^'\"]*['\"]" handler.mjs | head -30 || echo "无法分析"
else
    echo "未找到 handler.mjs"
fi
echo ""

echo "分析完成"
