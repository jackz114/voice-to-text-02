PS E:\projects_all\voice-to-text\voice-to-txt-02> npm run build

> voice-to-txt-02@0.1.0 build
> next build

▲ Next.js 16.2.0 (Turbopack)

- Environments: .env.local, .env

  Creating an optimized production build ...
  ✓ Compiled successfully in 8.0s
  Running TypeScript ..Failed to type check.

./open-next.config.ts:10:7
Type error: Type '"cloudflare-kv"' is not assignable to type 'IncludedIncrementalCache | LazyLoadedOverride<IncrementalCache> | undefined'.

8 | wrapper: "cloudflare-node",
9 | // 增量静态再生成（ISR）配置

> 10 | incrementalCache: "cloudflare-kv",

     |       ^

11 | // 标签缓存
12 | tagCache: "cloudflare-kv",
13 | // 队列配置（用于 ISR 后台更新）
Next.js build worker exited with code: 1 and signal: null
