#!/usr/bin/env node
/**
 * ESLint + TypeScript 自动修复工作流 - 终极版
 * 循环执行: 检查(TS+ESLint) → 自动修复(ESLint) → 重新检查 → 直到干净或 AI 介入
 * 用法: node eslint-auto-fix.js [文件路径]
 */

const { execSync } = require("child_process");
const fs = require("fs");

const OUTPUT_FILE = "errors.txt";
const MAX_BUFFER = 50 * 1024 * 1024;
const MAX_ITERATIONS = 5;

// 颜色输出
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 运行命令并捕获所有输出
function runCommand(command) {
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            maxBuffer: MAX_BUFFER,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return { success: true, output: output || '' };
    } catch (error) {
        return {
            success: false,
            output: (error.stdout || '') + (error.stderr || ''),
            exitCode: error.status
        };
    }
}

// 检查是否有实际错误（而非空输出）
function hasRealErrors(output) {
    if (!output || !output.trim()) return false;
    // 检查是否包含错误关键词
    const errorKeywords = ['error', 'Error', 'TS', '✖', '✕', '错误'];
    return errorKeywords.some(kw => output.includes(kw));
}

function main() {
    const targetFile = process.argv[2];
    const target = targetFile || 'src/';

    log("🔍 启动 ESLint + TypeScript 自动修复流程", 'cyan');
    log(`目标: ${target}\n`, 'cyan');

    let lastCombinedOutput = '';

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
        log(`━`.repeat(60), 'gray');
        log(`📋 第 ${iteration}/${MAX_ITERATIONS} 轮检查`, 'yellow');
        log(`━`.repeat(60), 'gray');

        let combinedOutput = '';
        let hasErrors = false;

        // 1. 运行 TypeScript 检查
        log("\n📝 运行 TypeScript 类型检查 (tsc --noEmit)...", 'cyan');
        const tsResult = runCommand('npx tsc --noEmit');

        if (!tsResult.success && hasRealErrors(tsResult.output)) {
            hasErrors = true;
            combinedOutput += `\n=== TypeScript 类型错误 ===\n${tsResult.output}\n`;
            log(`  ❌ 发现 TypeScript 错误`, 'red');
        } else {
            log(`  ✅ TypeScript 检查通过`, 'green');
        }

        // 2. 运行 ESLint 检查
        log("\n🔍 运行 ESLint 检查...", 'cyan');
        const eslintTarget = targetFile ? `"${targetFile}"` : 'src/';
        const eslintResult = runCommand(`npx eslint ${eslintTarget}`);

        if (!eslintResult.success && hasRealErrors(eslintResult.output)) {
            hasErrors = true;
            combinedOutput += `\n=== ESLint 错误 ===\n${eslintResult.output}\n`;
            log(`  ❌ 发现 ESLint 错误`, 'red');
        } else {
            log(`  ✅ ESLint 检查通过`, 'green');
        }

        // 3. 如果没有错误，流程结束
        if (!hasErrors) {
            fs.writeFileSync(OUTPUT_FILE, "✅ 无 TypeScript 或 ESLint 错误\n\n所有检查均已通过！");
            log(`\n${'🎉'.repeat(20)}`, 'green');
            log("✅ 全部检查通过！没有错误。", 'green');
            log(`${'🎉'.repeat(20)}\n`, 'green');
            process.exit(0);
        }

        // 4. 写入错误文件
        lastCombinedOutput = combinedOutput;
        fs.writeFileSync(OUTPUT_FILE, combinedOutput.trim());

        const errorCount = (combinedOutput.match(/error/gi) || []).length;
        log(`\n📄 发现约 ${errorCount} 个错误，已写入 ${OUTPUT_FILE}`, 'yellow');

        // 5. 尝试自动修复 (仅 ESLint 可修复的部分)
        log("\n🔧 尝试 ESLint --fix 自动修复格式问题...", 'cyan');
        runCommand(`npx eslint ${eslintTarget} --fix`);
        log("  ✓ 自动修复完成", 'green');

        // 6. 检查是否到达最后一轮
        if (iteration === MAX_ITERATIONS) {
            log(`\n${'⛔'.repeat(10)}`, 'red');
            log(`已达到最大迭代次数 (${MAX_ITERATIONS})`, 'red');
            log(`${'⛔'.repeat(10)}\n`, 'red');

            log("剩余错误已保存至 errors.txt，包含：", 'yellow');
            log("  • TypeScript 类型错误 (TSxxxx) - 需要修改代码逻辑", 'gray');
            log("  • ESLint 逻辑错误 - 需要修改代码逻辑", 'gray');
            log("  • 格式问题应该已被自动修复", 'gray');

            log(`\n💡 下一步建议：`, 'cyan');
            log(`   让 AI 读取 errors.txt 并修复剩余错误`, 'cyan');
            log(`\n   快捷指令：`, 'yellow');
            log(`   → 请读取 errors.txt 并修复所有错误`, 'gray');

            process.exit(1);
        }

        log("\n⏳ 准备进入下一轮检查...\n", 'gray');
    }
}

main();
