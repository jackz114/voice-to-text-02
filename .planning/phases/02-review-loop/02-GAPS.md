---
phase: 02-review-loop
type: gaps
source: "02-06 Human Verification"
gaps:
  - id: UI-01
    title: "Domain filter sidebar loses unselected domains after click"
    severity: medium
    affected: "02-02"
  - id: UI-02
    title: "Delete button missing in grid/card view mode"
    severity: medium
    affected: "02-02"
  - id: UI-03
    title: "Missing empty state and proactive review entry on /review"
    severity: medium
    affected: "02-04"
  - id: AUDIO-01
    title: "SiliconFlow API rejects audio/webm mime type"
    severity: high
    affected: "02-05"
  - id: UX-01
    title: "Knowledge detail modal lacks review navigation"
    severity: low
    affected: "02-02"
---

<gap_closure_plan>

## Gap 修复计划：Phase 02 Verification Fixes

### Gap AUDIO-01: 音频格式不支持（阻塞性）

**问题**：硅基流动 SenseVoice API 返回 `mime type audio/webm is not supported`

**解决方案**：
1. **方案A（推荐）**：客户端将 webm 转换为 wav/mp3 后上传
   - 使用 Web Audio API decodeAudioData + OfflineAudioContext 重采样为 16kHz mono WAV
   - 或引入 ffmpeg.wasm 在浏览器端转码（较重）

2. **方案B**：改用服务端转码
   - 上传 webm 到 Storage → 服务端下载 → ffmpeg 转码 → 调用 SenseVoice
   - 增加延迟和复杂度

**决策**：采用方案A，客户端转码为 WAV (16kHz, mono, 16-bit)，这是语音识别最兼容的格式。

**文件修改**：
- `src/components/capture/AudioRecorder.tsx` - 添加 `convertWebmToWav()` 函数
- `src/app/api/audio/transcribe/route.ts` - 更新 mime type 处理

---

### Gap UI-01: 领域筛选交互不友好

**问题**：点击某领域后，侧边栏只显示该领域，其他领域消失

**预期行为**：侧边栏始终显示所有领域，当前选中项高亮，点击另一项切换筛选

**修复**：
- `src/components/library/DomainSidebar.tsx` - 修改渲染逻辑，始终渲染全部领域
- 添加 `selectedDomain` state 控制高亮样式而非过滤列表

---

### Gap UI-02: 卡片模式缺少删除按钮

**问题**：列表视图有删除按钮，网格/卡片视图没有

**修复**：
- `src/components/library/KnowledgeItemCard.tsx` - 在卡片右上角添加删除按钮（悬停显示）
- 复用列表模式的删除确认逻辑

---

### Gap UI-03: 复习页面空状态与主动复习入口

**问题**：
1. 今日无复习条目时显示空白，用户体验差
2. 用户希望有主动复习的入口，而非完全强制

**修复**：
- `src/components/review/ReviewSession.tsx` - 添加空状态 UI：
  - 显示"今日复习已完成！"
  - 添加"主动复习"按钮，可切换到"浏览模式"查看所有知识条目
  - 浏览模式下不应用 FSRS 调度，仅做内容浏览

---

### Gap UX-01: 详情模态框增加复习引导

**修复**：
- `src/components/library/KnowledgeLibrary.tsx` - 在详情模态框底部添加：
  - "去复习"按钮 → 跳转到 `/review`
  - 或"标记为已复习"按钮 → 调用 `/api/review/rate` 直接评分

</gap_closure_plan>

<execution>

## 执行顺序（按依赖）

**Wave 1（阻塞性修复）**：
1. **02-05-GAP** - 修复音频格式转换（AUDIO-01）

**Wave 2（体验优化）**：
2. **02-02-GAP** - 修复领域筛选 + 卡片删除按钮（UI-01, UI-02）
3. **02-04-GAP** - 添加复习空状态和主动入口（UI-03）

**Wave 3（可选增强）**：
4. **02-02-GAP-UX** - 详情模态框复习引导（UX-01）

</execution>

<verification>

## 验证清单

- [ ] 录制 webm 音频后成功转写，文本填入输入框
- [ ] 点击领域筛选后侧边栏仍显示全部领域
- [ ] 卡片视图可删除条目
- [ ] /review 无条目时显示空状态和主动复习入口
- [ ] 详情模态框有复习相关操作按钮

</verification>
