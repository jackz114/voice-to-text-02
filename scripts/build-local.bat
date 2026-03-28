@echo off
chcp 65001 >nul

REM ========================================
REM OpenNext Cloudflare 本地构建和部署脚本 (Windows)
REM ========================================

echo ========================================
echo OpenNext Cloudflare 构建和部署
echo ========================================
echo.

REM 检查 Node.js 版本
echo [1/7] 检查 Node.js 版本...
node -v
npm -v
echo.

REM 清理旧的构建
echo [2/7] 清理旧的构建...
if exist ".open-next" (
    rmdir /s /q ".open-next"
    echo ✓ 已删除 .open-next
)

REM 检查 wrangler 是否登录
echo [3/7] 检查 wrangler 登录状态...
npx wrangler whoami
if %errorlevel% neq 0 (
    echo ⚠ wrangler 未登录，请先运行: npx wrangler login
    exit /b 1
)
echo.

REM 安装依赖
echo [4/7] 安装依赖...
call npm ci
if %errorlevel% neq 0 (
    echo ✗ 依赖安装失败
    exit /b 1
)
echo ✓ 依赖安装完成
echo.

REM 构建 OpenNext
echo [5/7] 构建 OpenNext...
echo 这可能需要几分钟...
npx opennextjs-cloudflare build
if %errorlevel% neq 0 (
    echo ✗ 构建失败
    exit /b 1
)
echo ✓ 构建成功
echo.

REM 检查构建输出
echo [6/7] 检查构建输出...
if exist ".open-next\worker.js" (
    echo ✓ worker.js 存在
    dir ".open-next\worker.js"
) else (
    echo ✗ worker.js 不存在
    exit /b 1
)

if exist ".open-next\assets" (
    echo ✓ assets 目录存在
) else (
    echo ⚠ assets 目录不存在
)
echo.

REM 本地预览（可选）
echo [7/7] 是否启动本地预览? (y/n)
set /p response=
if /i "%response%"=="y" (
    echo 启动本地预览...
    echo 按 Ctrl+C 停止
    npx opennextjs-cloudflare preview
) else (
    echo 跳过预览
)

echo.
echo ========================================
echo 构建完成!
echo ========================================
echo.
echo 下一步操作:
echo   1. 本地预览: npx opennextjs-cloudflare preview
echo   2. 部署到生产: npx opennextjs-cloudflare deploy
echo   3. 查看日志: npx wrangler tail
echo.

pause
