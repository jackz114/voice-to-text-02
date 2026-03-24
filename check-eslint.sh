#!/bin/bash
# 运行 ESLint 检查并将错误写入 errors.txt
# 用法: ./check-eslint.sh [文件路径]
# 如果不指定文件路径，则检查整个项目

OUTPUT_FILE="errors.txt"

# 清空之前的错误文件
> "$OUTPUT_FILE"

# 判断是否有传入特定文件
if [ $# -eq 0 ]; then
    # 检查整个项目
    echo "正在检查整个项目的 ESLint 错误..."
    npx eslint . --format json 2>/dev/null > eslint-result.json
else
    # 检查指定文件
    echo "正在检查文件: $1"
    npx eslint "$1" --format json 2>/dev/null > eslint-result.json
fi

# 解析 JSON 结果并生成可读的 errors.txt
node -e "
const fs = require('fs');
const results = JSON.parse(fs.readFileSync('eslint-result.json', 'utf8'));
let hasErrors = false;
let output = '';

results.forEach(result => {
    if (result.messages && result.messages.length > 0) {
        hasErrors = true;
        output += '\\n=== ' + result.filePath + ' ===\\n';
        result.messages.forEach(msg => {
            const severity = msg.severity === 2 ? '错误' : '警告';
            output += '[' + severity + '] ' + msg.line + ':' + msg.column + ' ' + msg.message + ' (' + msg.ruleId + ')\\n';
        });
    }
});

if (hasErrors) {
    fs.writeFileSync('$OUTPUT_FILE', output.trim());
    console.log('发现错误，已写入 ' + '$OUTPUT_FILE');
    process.exit(1);
} else {
    fs.writeFileSync('$OUTPUT_FILE', '✅ 无 ESLint 错误');
    console.log('✅ 无 ESLint 错误');
    process.exit(0);
}
"

EXIT_CODE=$?

# 清理临时文件
rm -f eslint-result.json

exit $EXIT_CODE
