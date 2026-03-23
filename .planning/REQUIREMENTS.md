# Requirements: 笔记助手 (bijiassistant)

**Defined:** 2026-03-22
**Core Value:** 学习时零负担记录，AI 替你管理遗忘曲线——让你知道自己学过什么，并在遗忘前精准唤醒它

## v1 Requirements

### Audio Capture

- [x] **AUDIO-01**: 用户可以录制音频并直接上传到 Supabase Storage
- [x] **AUDIO-02**: 音频文件绕过 Cloudflare Workers，避免内存限制
- [x] **AUDIO-03**: 支持多种音频编码格式的自动检测

### Audio Transcription

- [x] **TRANS-01**: 系统自动将录音转写为文字（OpenAI Whisper API）
- [x] **TRANS-02**: 处理 Whisper API 25MB 文件大小限制（如需要，支持分块）
- [x] **TRANS-03**: 转写结果关联到原始音频文件和用户

### Text Input

- [x] **TEXT-01**: 用户可以粘贴文章内容到系统
- [x] **TEXT-02**: 系统允许用户输入/编辑粘贴内容的标题和来源

### AI Knowledge Extraction

- [x] **EXTRACT-01**: AI 从转写文字或粘贴内容中提取结构化知识条目
- [x] **EXTRACT-02**: 每个知识条目包含：标题、内容、来源、创建时间
- [x] **EXTRACT-03**: 提取前显示给用户确认，避免幻觉
- [x] **EXTRACT-04**: AI 自动为知识条目分配领域/主题标签
- [x] **EXTRACT-05**: 用户可以手动调整领域标签

### Knowledge Library

- [x] **LIB-01**: 用户可以按领域分类浏览所有知识条目
- [x] **LIB-02**: 用户可以查看单个知识条目的完整内容
- [x] **LIB-03**: 用户可以删除不需要的知识条目

### FSRS Scheduling

- [x] **FSRS-01**: 每个知识条目创建时自动计算首次复习日期
- [x] **FSRS-02**: 系统记录每个条目的稳定性(S)和难度(D)参数
- [x] **FSRS-03**: 支持 FSRS 算法的记忆程度评分输入
- [x] **FSRS-04**: 根据评分自动计算并更新下次复习日期

### Daily Review

- [x] **REVIEW-01**: 用户可以看到「今天要复习」的知识条目列表
- [ ] **REVIEW-02**: 复习界面显示知识条目内容和复习来源
- [ ] **REVIEW-03**: 用户可以选择记忆程度（Again/Hard/Good/Easy）
- [x] **REVIEW-04**: 系统根据评分更新 FSRS 参数和下次复习日期

### Notifications

- [ ] **NOTIFY-01**: 系统在复习节点到达时主动提醒用户
- [ ] **NOTIFY-02**: 每日最多一次提醒，仅当有复习条目时发送
- [ ] **NOTIFY-03**: 提醒消息包含当天需要复习的条目数量和领域
- [ ] **NOTIFY-04**: 支持邮件作为提醒渠道

### Search

- [ ] **SEARCH-01**: 用户可以用自然语言搜索自己的知识库
- [ ] **SEARCH-02**: 搜索结果按相关性排序
- [ ] **SEARCH-03**: 搜索结果显示知识条目的预览和来源

## v2 Requirements

### Search Enhancement

- **SEM-01**: 语义搜索（pgvector 向量相似度）

### Knowledge Management

- **KNOW-01**: 知识图谱可视化（主题关联图）
- **KNOW-02**: AI 生成复习测验题目（主动回忆）

### Audio Enhancement

- **AUDIO-V2-01**: 支持上传现有音频文件（非实时录制）
- **AUDIO-V2-02**: 客户端音频预处理（降噪、静音去除）

## Out of Scope

| Feature | Reason |
|---------|--------|
| 移动端 App | Web-first，验证产品后再考虑原生 |
| 多人协作/知识分享 | 个人工具定位，不涉及社交功能 |
| 视频文件处理 | 复杂度和存储成本过高，音频足够 |
| 实时转写 | 增加流式复杂度和成本，上传后处理足够 |
| Gamification（积分/徽章/连胜） | 用户认可真实数据而非游戏化激励 |
| 复杂的卡片编辑器 | AI 自动生成是核心，避免手动创建摩擦 |
| Obsidian 式双向链接 | 维护成本过高，分类+搜索覆盖需求 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIO-01 | Phase 1 — Capture Pipeline | Complete |
| AUDIO-02 | Phase 1 — Capture Pipeline | Complete |
| AUDIO-03 | Phase 1 — Capture Pipeline | Complete |
| TRANS-01 | Phase 1 — Capture Pipeline | Complete |
| TRANS-02 | Phase 1 — Capture Pipeline | Complete |
| TRANS-03 | Phase 1 — Capture Pipeline | Complete |
| TEXT-01 | Phase 1 — Capture Pipeline | Complete |
| TEXT-02 | Phase 1 — Capture Pipeline | Complete |
| EXTRACT-01 | Phase 1 — Capture Pipeline | Complete |
| EXTRACT-02 | Phase 1 — Capture Pipeline | Complete |
| EXTRACT-03 | Phase 1 — Capture Pipeline | Complete |
| EXTRACT-04 | Phase 1 — Capture Pipeline | Complete |
| EXTRACT-05 | Phase 1 — Capture Pipeline | Complete |
| LIB-01 | Phase 2 — Review Loop | Complete |
| LIB-02 | Phase 2 — Review Loop | Complete |
| LIB-03 | Phase 2 — Review Loop | Complete |
| FSRS-01 | Phase 2 — Review Loop | Complete |
| FSRS-02 | Phase 2 — Review Loop | Complete |
| FSRS-03 | Phase 2 — Review Loop | Complete |
| FSRS-04 | Phase 2 — Review Loop | Complete |
| REVIEW-01 | Phase 2 — Review Loop | Complete |
| REVIEW-02 | Phase 2 — Review Loop | Pending |
| REVIEW-03 | Phase 2 — Review Loop | Pending |
| REVIEW-04 | Phase 2 — Review Loop | Complete |
| NOTIFY-01 | Phase 3 — Retention Engine | Pending |
| NOTIFY-02 | Phase 3 — Retention Engine | Pending |
| NOTIFY-03 | Phase 3 — Retention Engine | Pending |
| NOTIFY-04 | Phase 3 — Retention Engine | Pending |
| SEARCH-01 | Phase 3 — Retention Engine | Pending |
| SEARCH-02 | Phase 3 — Retention Engine | Pending |
| SEARCH-03 | Phase 3 — Retention Engine | Pending |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
