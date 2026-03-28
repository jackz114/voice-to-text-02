#!/bin/bash

# ========================================
# OpenNext Cloudflare 本地构建和部署脚本
# ========================================

set -e  # 遇到错误立即退出

echo "========================================"
echo "OpenNext Cloudflare 构建和部署"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Node.js 版本
echo -e "${BLUE}[1/7] 检查 Node.js 版本...${NC}"
node -v
npm -v
echo ""

# 清理旧的构建
echo -e "${BLUE}[2/7] 清理旧的构建...${NC}"
if [ -d ".open-next" ]; then
    rm -rf .open-next
    echo -e "${GREEN}✓ 已删除 .open-next${NC}"
fi

# 检查 wrangler 是否登录
echo -e "${BLUE}[3/7] 检查 wrangler 登录状态...${NC}"
npx wrangler whoami || {
    echo -e "${YELLOW}⚠ wrangler 未登录，请先运行: npx wrangler login${NC}"
    exit 1
}
echo ""

# 安装依赖
echo -e "${BLUE}[4/7] 安装依赖...${NC}"
npm ci
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 构建 OpenNext
echo -e "${BLUE}[5/7] 构建 OpenNext...${NC}"
echo "这可能需要几分钟..."
npx opennextjs-cloudflare build 2>&1 | tee build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ 构建成功${NC}"
else
    echo -e "${RED}✗ 构建失败，查看 build.log${NC}"
    exit 1
fi
echo ""

# 检查构建输出
echo -e "${BLUE}[6/7] 检查构建输出...${NC}"
if [ -f ".open-next/worker.js" ]; then
    echo -e "${GREEN}✓ worker.js 存在${NC}"
    ls -lh .open-next/worker.js
else
    echo -e "${RED}✗ worker.js 不存在${NC}"
    exit 1
fi

if [ -d ".open-next/assets" ]; then
    echo -e "${GREEN}✓ assets 目录存在${NC}"
    echo "  文件数量: $(find .open-next/assets -type f | wc -l)"
else
    echo -e "${YELLOW}⚠ assets 目录不存在${NC}"
fi
echo ""

# 本地预览（可选）
echo -e "${BLUE}[7/7] 是否启动本地预览? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${GREEN}启动本地预览...${NC}"
    echo "按 Ctrl+C 停止"
    npx opennextjs-cloudflare preview
else
    echo -e "${YELLOW}跳过预览${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}构建完成!${NC}"
echo "========================================"
echo ""
echo "下一步操作:"
echo "  1. 本地预览: npx opennextjs-cloudflare preview"
echo "  2. 部署到生产: npx opennextjs-cloudflare deploy"
echo "  3. 查看日志: npx wrangler tail"
echo ""
