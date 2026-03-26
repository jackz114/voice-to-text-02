// eslint.config.js
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 解决 __dirname 在 ESM 中的缺失
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ESLint v9 Flat Config
 * 策略：ESLint 负责逻辑错误与最佳实践，Prettier 负责代码风格。
 */

// --- [修改开始] ---
// 1. 将原本直接 export 的数组赋值给一个名为 `config` 的常量
const config = [
  // 1. 全局忽略文件 (Ignored Files)
  {
    ignores: [
      "node_modules",
      "dist",
      ".open-next/**", // 忽略整个 opennext 构建输出目录
      "worker-configuration.d.ts",
      ".vinxi", // Vinxi 构建目录
      ".wrangler",
      "*.min.js",
      "coverage",
      ".git",
      "*.md",
      "*.json", // JSON 通常由 Prettier 单独处理，ESLint 不介入
    ],
  },

  // 2. 基础 JS 推荐规则
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...js.configs.recommended,
  },

  // 3. TypeScript + React 通用配置
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true, // 启用项目服务，自动读取 tsconfig.json
        tsconfigRootDir: __dirname,
      },
      globals: {
        // 浏览器环境全局变量
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        Request: "readonly",
        Response: "readonly",
        fetch: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        // Node 环境 (Vinxi/Cloudflare Workers 混合)
        process: "readonly",
        global: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        exports: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      // 合并官方推荐规则
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // 自定义规则覆盖
      "no-unused-vars": "off", // 关闭基础规则，使用 TS 版本
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // React 特定设置
      "react/react-in-jsx-scope": "off", // Vite/Vinxi 不需要引入 React
      "react/prop-types": "off", // TypeScript 已经处理了类型检查

      // 允许 console (开发调试方便，生产环境可由构建工具移除)
      "no-console": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // 4. Prettier 兼容层 (必须放在最后)
  // 作用：关闭所有与 Prettier 格式化规则冲突的 ESLint 规则
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    ...prettierConfig,
  },
];

// 2. 导出这个命名变量，而不是直接导出匿名数组
export default config;
// --- [修改结束] ---
