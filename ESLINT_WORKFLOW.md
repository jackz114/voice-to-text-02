# ESLint 自动检查修复流程

这个项目支持 AI 自动化的 ESLint 检查修复循环。

## 核心脚本

### 1. 检查脚本 `check-eslint.js`
运行 ESLint 并将错误写入 `errors.txt`：

```bash
# 检查整个项目
node check-eslint.js

# 或检查特定文件
node check-eslint.js src/components/MyComponent.tsx
```

### 2. 自动修复脚本 `eslint-auto-fix.js`
循环检查并自动修复，直到无错误或达到最大迭代次数：

```bash
# 自动修复整个项目
node eslint-auto-fix.js

# 或修复特定文件
node eslint-auto-fix.js src/components/MyComponent.tsx
```

## npm 脚本

```bash
# 快速检查（无自动修复）
npm run lint:check

# 自动修复循环
npm run lint:fix
```

## errors.txt 文件格式

当发现错误时，`errors.txt` 内容示例：

```
=== E:\projects\...\KnowledgeLibrary.tsx ===
[错误] 第45行:10 'useState' is defined but never used (@typescript-eslint/no-unused-vars)
[警告] 第120行:5 Unexpected any (@typescript-eslint/no-explicit-any)
    💡 可自动修复
[错误] 第200行:1 Missing semicolon (semi)
    💡 可自动修复
```

当无错误时：
```
✅ 无 ESLint 错误
```

## 在 Claude Code 中使用

### 方式一：单次检查流程
每次修改代码后，让 AI 执行：

```
1. 运行: npm run lint:check
2. 读取 errors.txt
3. 如果有错误，修复后重复步骤 1
4. 如果显示"✅ 无 ESLint 错误"，流程结束
```

### 方式二：使用 GSD Quick 任务
创建一个自动化修复任务：

```
/gsd:quick 修复 ESLint 错误 --full
```

然后在任务描述中指定要修复的文件。

### 方式三：手动触发自动修复
直接运行：

```bash
npm run lint:fix
```

这个命令会：
1. 检查错误
2. 尝试自动修复（如分号、引号等格式问题）
3. 重新检查
4. 如果还有错误，显示在 errors.txt 中等待手动修复
5. 按回车继续下一轮
6. 直到无错误或达到最大迭代次数（默认5轮）

## 可自动修复的规则

以下错误可以自动修复：
- `semi` - 分号缺失
- `quotes` - 引号不一致
- `comma-dangle` - 尾随逗号
- `indent` - 缩进
- `no-trailing-spaces` - 行尾空格
- `@typescript-eslint/no-extra-semi` - 多余分号

## 需要手动修复的常见错误

- `no-unused-vars` - 未使用变量（需删除或标记为 `_`）
- `no-explicit-any` - 使用了 any 类型（需添加类型定义）
- `react-hooks/exhaustive-deps` - Hook 依赖项问题
- `@typescript-eslint/no-floating-promises` - Promise 未处理

## 集成到工作流

### 修改文件后的标准流程

```
用户: 帮我修改 KnowledgeLibrary.tsx，添加一个新功能

AI: [完成代码修改]

AI: 现在运行 ESLint 检查...
    npm run lint:check

AI: 读取 errors.txt...
    [如果有错误] 发现 X 个错误，正在修复...
    [修复后重新检查] npm run lint:check
    [重复直到干净]

AI: ✅ ESLint 检查通过，代码已就绪！
```

### 在 CLAUDE.md 中添加规范

建议在 `CLAUDE.md` 中添加：

```markdown
## 代码提交前检查

任何代码修改完成后，必须执行：

```bash
npm run lint:check
```

如果 `errors.txt` 显示有错误，必须修复直到显示"✅ 无 ESLint 错误"。
```

## 配置说明

### 修改最大迭代次数

编辑 `eslint-auto-fix.js`，修改：
```javascript
const MAX_ITERATIONS = 5; // 改为需要的次数
```

### 忽略特定文件

编辑 `eslint.config.mjs` 中的 `ignores` 数组：

```javascript
{
  ignores: [
    "node_modules",
    "dist",
    "**/*.generated.ts", // 添加你的忽略规则
  ],
}
```

## 故障排除

### ESLint 找不到配置文件
确保 `eslint.config.mjs` 存在于项目根目录。

### 权限错误 (Windows)
如果运行脚本时出现权限错误，使用：
```bash
node check-eslint.js
# 而不是
./check-eslint.js
```

### errors.txt 不更新
检查 ESLint 是否正确安装：
```bash
npx eslint --version
```

### 大量错误 overwhelming
建议先运行一次自动修复：
```bash
npm run lint:fix
```
这会自动修复大部分格式问题，剩下的逻辑错误再逐个处理。
