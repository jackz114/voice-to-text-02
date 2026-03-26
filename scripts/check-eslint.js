#!/usr/bin/env node
/**
 * ESLint + TypeScript 检查脚本
 * 运行 tsc 和 eslint，将错误写入 errors.txt
 * 用法: node check-eslint.js [文件路径]
 */

const { execSync } = require("child_process");
const fs = require("fs");

const OUTPUT_FILE = "errors.txt";
const MAX_BUFFER = 50 * 1024 * 1024;

// 颜色输出
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

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

function hasRealErrors(output) {
    if (!output || !output.trim()) return false;
    const errorKeywords = ['error', 'Error', 'TS', '✖', '✕', '错误'];
    return errorKeywords.some(kw => output.includes(kw));
}

function main() {
    const targetFile = process.argv[2];
    const target = targetFile || 'src/';

    console.log(targetFile ? `正在检查文件: ${targetFile}` : "正在检查 src/ 目录...");

    let combinedOutput = '';
    let hasErrors = false;

    // 1. TypeScript 检查
    log("\n📝 TypeScript 类型检查...", 'cyan');
    const tsResult = runCommand('npx tsc --noEmit');

    if (!tsResult.success && hasRealErrors(tsResult.output)) {
        hasErrors = true;
        combinedOutput += `\n=== TypeScript 类型错误 ===\n${tsResult.output}\n`;
        log("  ❌ 发现 TypeScript 错误", 'red');
    } else {
        log("  ✅ 通过", 'green');
    }

    // 2. ESLint 检查
    log("🔍 ESLint 检查...", 'cyan');
    const eslintTarget = targetFile ? `"${targetFile}"` : 'src/';
    const eslintResult = runCommand(`npx eslint ${eslintTarget}`);

    if (!eslintResult.success && hasRealErrors(eslintResult.output)) {
        hasErrors = true;
        combinedOutput += `\n=== ESLint 错误 ===\n${eslintResult.output}\n`;
        log("  ❌ 发现 ESLint 错误", 'red');
    } else {
        log("  ✅ 通过", 'green');
    }

    // 3. 输出结果
    if (!hasErrors) {
        fs.writeFileSync(OUTPUT_FILE, "✅ 无 TypeScript 或 ESLint 错误");
        log("\n✅ 所有检查通过！", 'green');
        process.exit(0);
    } else {
        fs.writeFileSync(OUTPUT_FILE, combinedOutput.trim());
        const errorCount = (combinedOutput.match(/error/gi) || []).length;
        log(`\n❌ 发现错误（约 ${errorCount} 个），已写入 ${OUTPUT_FILE}`, 'red');
        process.exit(1);
    }
}

main();
