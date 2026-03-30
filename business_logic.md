# 业务逻辑文档 (Business Logic)

> 本文档描述 voice-to-txt-02 项目的业务逻辑架构、数据流和功能模块设计。

---

## 📌 项目概述

**voice-to-txt-02** 是一个基于 Next.js + Supabase 的语音转文本 (Voice-to-Text) Web 应用。

### 核心功能
- 语音录制与上传
- 自动语音转文本
- 转录历史管理
- 用户认证与数据隔离
- **支付系统（PayPal 集成）**
- **第三方登录（Google OAuth）**

---

## 🏗️ 业务架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        语音转文本应用 (Voice-to-Text)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ 用户访问  │───▶│ 用户认证  │───▶│ 语音上传  │───▶│ 转文本处理 │          │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘          │
│       │               │                              │                  │
│       │               │                              ▼                  │
│       │               │                       ┌──────────┐              │
│       │               │                       │  支付中心  │              │
│       │               │                       └──────────┘              │
│       │               │                                                 │
│       ▼               ▼                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Google   │    │ 历史记录  │◄───│ 文本编辑  │◄───│ 结果展示  │          │
│  │ OAuth    │    └──────────┘    └──────────┘    └──────────┘          │
│  └──────────┘                                                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 功能模块

### 1. 用户认证模块 (Auth)

#### 功能点
| 功能 | 描述 | 技术实现 |
|------|------|----------|
| 用户注册 | 邮箱+密码注册，人机验证 | Supabase Auth + Turnstile |
| 用户登录 | JWT Token 认证 | Supabase Auth |
| **Google OAuth** | **一键 Google 账号登录** | **Supabase Auth Provider** |
| 密码重置 | 邮件重置密码 | Supabase Auth |
| 会话管理 | Token 刷新、登出 | React Context + Supabase |

#### Google OAuth 流程
```
用户点击 "使用 Google 登录"
    ↓
调用 supabase.auth.signInWithOAuth({ provider: "google" })
    ↓
跳转至 Google 授权页面
    ↓
用户授权后跳转回 /auth/callback
    ↓
交换 code 获取 session
    ↓
完成登录，跳转至首页
```

#### 数据流
```
用户提交注册表单
    ↓
Turnstile 验证通过
    ↓
Supabase Auth 创建用户
    ↓
存储用户资料到 users 表
    ↓
跳转至首页
```

---

### 2. 支付模块 (Payment)

#### 功能点
| 功能 | 描述 | 技术实现 |
|------|------|----------|
| **PayPal 一次性支付** | **购买转录时长包** | **PayPal Checkout API** |
| **PayPal 订阅** | **月度会员自动续费** | **PayPal Subscriptions API** |
| 订单管理 | 创建、捕获、验证订单 | Server-side API Routes |
| 支付记录 | 存储交易历史 | Supabase Database |

#### PayPal 支付流程
```
用户选择商品（如 100 分钟转录服务 $9.99）
    ↓
点击 PayPal 按钮
    ↓
前端调用 POST /api/paypal/create-order
    ↓
后端创建 PayPal 订单，返回 orderId
    ↓
PayPal SDK 弹出支付窗口
    ↓
用户完成支付授权
    ↓
前端调用 POST /api/paypal/capture-order
    ↓
后端捕获订单，完成扣款
    ↓
更新用户余额/服务时长
    ↓
显示支付成功
```

#### PayPal 订阅流程
```
用户选择订阅计划（如月度会员 $19.99/月）
    ↓
点击订阅按钮
    ↓
PayPal SDK 弹出订阅窗口
    ↓
用户授权定期扣款
    ↓
前端调用 POST /api/paypal/verify-subscription
    ↓
后端验证订阅状态
    ↓
激活会员权益
    ↓
显示订阅成功
```

---

### 3. 语音转录核心模块 (Transcription)

#### 功能点
| 功能 | 描述 | 技术实现 |
|------|------|----------|
| 实时录音 | 浏览器麦克风录制 | MediaRecorder API |
| 文件上传 | 支持 mp3/wav/m4a 等格式 | Supabase Storage |
| 语音识别 | 调用语音识别 API | Whisper API / Web Speech API |
| 转录状态 | 显示处理进度 | WebSocket / Polling |
| **余额检查** | **转录前检查用户余额** | **Database Query** |

#### 数据流
```
用户点击录音 / 选择文件
    ↓
检查用户余额/剩余时长（如不足则引导至支付）
    ↓
音频上传至 Supabase Storage
    ↓
创建转录记录 (status: processing)
    ↓
扣除用户相应时长
    ↓
调用语音识别服务
    ↓
更新转录结果 (status: completed)
    ↓
用户查看/编辑文本
```

#### 转录状态机
```
┌──────────┐    ┌────────────┐    ┌───────────┐    ┌──────────┐
│  pending │───▶│ processing │───▶│ completed │───▶│  edited  │
└──────────┘    └────────────┘    └───────────┘    └──────────┘
                                        │
                                        ▼
                                  ┌──────────┐
                                  │  failed  │
                                  └──────────┘
```

---

### 4. 数据管理模块 (Data Management)

#### 功能点
| 功能 | 描述 | 技术实现 |
|------|------|----------|
| 历史记录列表 | 分页展示用户转录记录 | Supabase + Drizzle |
| 记录搜索 | 按关键词/日期筛选 | Full-text search |
| 记录编辑 | 修改转录文本内容 | Supabase update |
| 记录删除 | 软删除/硬删除 | Supabase delete |
| 导出功能 | 导出为 txt/pdf 等格式 | Client-side export |
| **交易记录** | **查看支付/订阅历史** | **Supabase Query** |

---

### 5. 设置模块 (Settings)

#### 功能点
| 功能 | 描述 | 技术实现 |
|------|------|----------|
| 语言偏好 | 选择识别语言 (zh/en/ja 等) | Zustand + LocalStorage |
| 输出格式 | 文本格式设置 | Zustand |
| 账户管理 | 修改密码、删除账户 | Supabase Auth |
| **订阅管理** | **查看/取消 PayPal 订阅** | **PayPal API** |
| **支付方式** | **绑定/解绑 PayPal** | **PayPal Vault** |

---

## 🗄️ 数据模型

### 用户表 (users)
```typescript
interface User {
  id: string;           // UUID, 主键
  email: string;        // 邮箱，唯一
  created_at: string;   // 创建时间
  updated_at: string;   // 更新时间
  // OAuth 相关
  provider: string;     // 认证方式: email, google
  avatar_url?: string;  // Google 头像
  full_name?: string;   // Google 显示名称
}
```

### 文件夹表 (folders)
```typescript
interface Folder {
  id: string;              // UUID, 主键
  user_id: string;         // 外键 -> users.id
  name: string;            // 文件夹名称
  created_at: string;      // 创建时间
  updated_at: string;      // 更新时间
}
```

### 转录记录表 (transcriptions)
```typescript
interface Transcription {
  id: string;              // UUID, 主键
  user_id: string;         // 外键 -> users.id
  folder_id: string | null; // 外键 -> folders.id, null 表示默认/未分类
  audio_url: string;       // 音频文件 Storage URL
  text: string | null;     // 转录文本结果
  status: 'pending' | 'processing' | 'completed' | 'failed';
  language: string;        // 识别语言代码 (zh, en, ja...)
  duration_seconds: number | null;  // 音频时长
  file_name: string;       // 原始文件名
  file_size: number;       // 文件大小 (bytes)
  cost_minutes: number;    // 消耗的转录时长
  created_at: string;      // 创建时间
  updated_at: string;      // 更新时间
  completed_at: string | null;  // 完成时间
}
```

### **支付记录表 (payments)** ⭐
```typescript
interface Payment {
  id: string;              // UUID, 主键
  user_id: string;         // 外键 -> users.id
  paypal_order_id: string; // PayPal 订单 ID
  paypal_payer_id?: string;// PayPal 付款人 ID
  amount: number;          // 支付金额
  currency: string;        // 币种 (USD)
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;     // 商品描述
  payment_type: 'onetime' | 'subscription'; // 支付类型
  created_at: string;      // 创建时间
  completed_at?: string;   // 完成时间
}
```

### **订阅记录表 (subscriptions)** ⭐
```typescript
interface Subscription {
  id: string;                    // UUID, 主键
  user_id: string;               // 外键 -> users.id
  paypal_subscription_id: string;// PayPal 订阅 ID
  paypal_plan_id: string;        // PayPal 计划 ID
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  current_period_start: string;  // 当前周期开始
  current_period_end: string;    // 当前周期结束
  cancel_at_period_end: boolean; // 是否到期取消
  created_at: string;            // 创建时间
  cancelled_at?: string;         // 取消时间
}
```

### **用户余额表 (user_balances)** ⭐
```typescript
interface UserBalance {
  user_id: string;         // UUID, 主键，外键 -> users.id
  total_minutes: number;   // 总购买时长（分钟）
  used_minutes: number;    // 已使用时长（分钟）
  remaining_minutes: number; // 剩余时长（计算字段）
  subscription_status: 'none' | 'active' | 'expired'; // 订阅状态
  updated_at: string;      // 更新时间
}
```

### 关系图
```
┌─────────────┐         ┌──────────────────┐
│    users    │         │  transcriptions  │
├─────────────┤         ├──────────────────┤
│ id (PK)     │◄───────│ user_id (FK)     │
│ email       │   1:M   │ id (PK)          │
│ provider    │         │ folder_id (FK)   │
│ avatar_url  │         │ audio_url        │
└──────┬──────┘         │ status           │
       │                └──────────────────┘
       │
       │    1:M   ┌──────────────────┐
       ├─────────▶│     folders      │
       │          ├──────────────────┤
       │          │ id (PK)          │
       │          │ user_id (FK)     │
       │          │ name             │
       │          └──────────────────┘
       │
       │    1:1   ┌──────────────────┐
       ├─────────▶│  user_balances   │
       │          ├──────────────────┤
       │          │ user_id (PK/FK)  │
       │          │ total_minutes    │
       │          │ remaining_minutes│
       │          └──────────────────┘
       │
       │    1:M   ┌──────────────────┐
       ├─────────▶│     payments     │
       │          ├──────────────────┤
       │          │ id (PK)          │
       │          │ user_id (FK)     │
       │          │ paypal_order_id  │
       │          │ amount           │
       │          │ status           │
       │          └──────────────────┘
       │
       │    1:M   ┌──────────────────┐
       └─────────▶│  subscriptions   │
                  ├──────────────────┤
                  │ id (PK)          │
                  │ user_id (FK)     │
                  │ paypal_sub_id    │
                  │ status           │
                  └──────────────────┘
```

---

## 🔐 权限控制 (RLS)

### Row Level Security 策略

#### folders 表
```sql
-- 用户只能查看自己的文件夹
CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的文件夹
CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的文件夹
CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的文件夹
CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);
```

#### transcriptions 表
```sql
-- 用户只能查看自己的转录记录
CREATE POLICY "Users can view own transcriptions"
  ON transcriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的转录记录
CREATE POLICY "Users can create own transcriptions"
  ON transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的转录记录
CREATE POLICY "Users can update own transcriptions"
  ON transcriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的转录记录
CREATE POLICY "Users can delete own transcriptions"
  ON transcriptions FOR DELETE
  USING (auth.uid() = user_id);
```

#### payments 表
```sql
-- 用户只能查看自己的支付记录
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);
```

#### subscriptions 表
```sql
-- 用户只能查看自己的订阅
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

#### user_balances 表
```sql
-- 用户只能查看自己的余额
CREATE POLICY "Users can view own balance"
  ON user_balances FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🔄 核心业务流程

### 流程 1：用户注册与登录（邮箱）
```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│  用户    │───▶│  填写表单   │───▶│  Turnstile  │───▶│  Supabase│
│  访问   │    │ (邮箱/密码) │    │  人机验证   │    │  创建用户 │
└─────────┘    └─────────────┘    └─────────────┘    └────┬────┘
                                                          │
    ┌──────────────────────────────────────────────────────┘
    ▼
┌─────────┐    ┌─────────────┐    ┌─────────────┐
│  首页   │◄───│  初始化状态  │◄───│  存储 Token  │
│         │    │(AuthContext)│    │  (Cookie)   │
└─────────┘    └─────────────┘    └─────────────┘
```

### 流程 2：Google OAuth 登录
```
┌─────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│  用户    │───▶│ 点击 Google │───▶│ 跳转 Google │───▶│ 用户授权   │
│  访问   │    │  登录按钮   │    │  授权页面   │    │  登录      │
└─────────┘    └──────────────┘    └─────────────┘    └──────┬──────┘
                                                             │
    ┌────────────────────────────────────────────────────────┘
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────┐
│  跳转首页   │◄───│ 获取 Session │◄───│  交换 Code  │◄───│ 回调地址 │
│             │    │  设置用户    │    │             │    │ /callback│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────┘
```

### 流程 3：PayPal 一次性支付
```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  用户    │───▶│ 选择商品   │───▶│ 点击 PayPal │───▶│ 创建订单   │
│  访问   │    │  查看价格  │    │  支付按钮   │    │ (Backend)  │
└─────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                            │
    ┌───────────────────────────────────────────────────────┘
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 支付成功页  │◄───│ 更新余额   │◄───│ 捕获订单   │◄───│ PayPal 授权 │
│ 显示成功信息 │    │ 记录交易   │    │ (Backend)  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 流程 4：PayPal 订阅
```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  用户    │───▶│ 选择订阅   │───▶│ 点击订阅   │───▶│ PayPal 授权 │
│  访问   │    │  月度计划  │    │  按钮      │    │  定期扣款   │
└─────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                            │
    ┌───────────────────────────────────────────────────────┘
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 订阅成功页  │◄───│ 激活会员   │◄───│ 验证订阅   │
│ 显示会员信息 │    │ 记录订阅   │    │ (Backend)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 流程 5：语音转录（含余额检查）
```
┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  开始   │───▶│ 检查余额   │───▶│ 余额充足?  │───▶│ 引导至支付  │
│  转录   │    │             │    │             │    │  (如不足)   │
└─────────┘    └─────────────┘    └──────┬──────┘    └─────────────┘
                                         │ 是
                                         ▼
                              ┌─────────────────────┐
                              │   扣除预估时长      │
                              │   开始转录处理      │
                              └─────────────────────┘
```

---

## 🛠️ 技术栈映射

| 业务需求 | 技术选型 | 用途 |
|----------|----------|------|
| 前端框架 | Next.js 16 | SSR/SSG、API Routes |
| UI 渲染 | React 19 | 组件化 UI |
| 样式 | Tailwind CSS v4 | 原子化 CSS |
| 字体 | Geist | 品牌字体 |
| 状态管理 | React Context | 认证状态 |
| 表单处理 | React Hook Form | 表单验证与提交 |
| 类型验证 | Zod | 运行时类型检查 |
| 数据库 | Supabase Postgres | 数据持久化 |
| ORM | Drizzle ORM | 类型安全的数据库操作 |
| 认证 | Supabase Auth | 用户认证 + **Google OAuth** |
| 存储 | Supabase Storage | 音频文件存储 |
| 人机验证 | Turnstile | 防刷验证 |
| **支付** | **PayPal SDK** | **支付与订阅处理** |
| 部署 | Cloudflare Workers | 边缘部署 |

---

## 📋 开发任务清单

### 阶段 1：基础架构
- [x] 配置 Drizzle ORM 和数据库迁移
- [ ] 创建数据库 Schema（payments, subscriptions, user_balances）
- [ ] 配置 Supabase RLS 策略

### 阶段 2：用户认证 ✅
- [x] **Google OAuth 集成**
- [x] 登录页面 (/login)
- [x] OAuth 回调处理 (/auth/callback)
- [x] 认证状态管理 (AuthProvider)

### 阶段 3：支付系统 ✅
- [x] **PayPal SDK 集成**
- [x] 支付按钮组件
- [x] 订阅按钮组件
- [x] API 路由 (/api/paypal/*)
- [x] 支付示例页面 (/payment)
- [ ] 支付记录数据库表
- [ ] 订阅 Webhook 处理

### 阶段 4：核心功能
- [ ] 录音组件 (MediaRecorder)
- [ ] 文件上传组件
- [ ] 余额检查逻辑
- [ ] 转录处理 API
- [ ] 语音识别服务集成

### 阶段 5：数据管理
- [ ] 历史记录列表页 (/history)
- [ ] 转录详情页 (/transcription/[id])
- [ ] 文本编辑功能
- [ ] 交易记录页面 (/transactions)
- [ ] 订阅管理页面 (/subscription)

### 阶段 6：优化与部署
- [ ] 响应式适配
- [ ] 暗黑模式完善
- [ ] Cloudflare 部署配置
- [ ] PayPal Webhook 配置

---

## 🔧 环境变量配置

### 必需的环境变量
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PayPal 配置
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_API_URL=https://api-m.sandbox.paypal.com  # 生产环境使用 api-m.paypal.com

# 可选: PayPal 订阅计划 ID
NEXT_PUBLIC_PAYPAL_PLAN_ID=your_paypal_plan_id
```

### Supabase Google OAuth 配置步骤
1. 进入 Supabase Dashboard → Authentication → Providers
2. 启用 Google Provider
3. 配置 Google OAuth 2.0 凭据（从 Google Cloud Console 获取）
4. 设置回调 URL: `https://your-domain.com/auth/callback`

### PayPal 配置步骤
1. 访问 [PayPal Developer Dashboard](https://developer.paypal.com/)
2. 创建 Sandbox 应用，获取 Client ID 和 Secret
3. 配置 Webhook（生产环境需要）
4. 创建订阅计划（Products & Plans）

---

## 📚 相关文档

- [AGENTS.md](./AGENTS.md) - 项目技术规范
- [官方文档/supabase/](./官方文档/supabase/) - Supabase 相关文档
- [PayPal Developer Docs](https://developer.paypal.com/docs/)
- [Supabase Auth Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

*最后更新: 2026-03-21*
