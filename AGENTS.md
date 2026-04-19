# Project V-Menu - Agent Context

> **CRITICAL INSTRUCTION**: This project is the engineering landing of the "AI Menu Growth Engine" product line. It follows the shared identity and multi-product boundary rules defined in the root `docs/architecture/MULTI_PRODUCT_BOUNDARY_AND_IDENTITY.md`.

## 1. Project Background & Status

### 1.1 Context
V-Menu is an independent product line focused on AI-powered food photography enhancement, menu copy generation, and related F&B growth workflows. It reuses the shared identity layer (Users/Orgs) from `v-backend` while keeping its own business semantics, routes, deployment config, and visual system.

### 1.2 Status: Engineering Landing In Progress
- **Routes**: Marketing, auth, demo, privacy/terms, and dashboard routes are implemented in `src/router/index.tsx`.
- **Auth**: Uses shared backend auth endpoints (`/auth/login`, `/auth/register`, `/auth/me`) through the local Axios client and Zustand auth store.
- **Entitlement**: Frontend-side `hasMenuAccess` checks exist, with a development-oriented fallback when entitlement data is missing.
- **i18n**: TH / ZH / EN locale files are present, but localization completeness should still be treated as an active quality goal, not a finished fact.
- **Deployment**: The project has its own `deploy/` directory and is expected to sit behind the shared gateway under `infra/nginx/`.

## 2. Engineering Architecture

### 2.1 Tech Stack
- **Framework**: React 19 + Vite.
- **Styling**: **Tailwind CSS v4** (Build-time extraction).
- **Global State**: **Zustand** (Simple, high-performance auth/user state).
- **API Client**: **Axios** with Interceptors (Handles 401 redirects, Token injection, and business code 200/0 mapping).
- **i18n**: `react-i18next`.
- **Routing**: `react-router-dom` v7.

### 2.2 Design System (Glassmorphism)
- **Base Background**: `#060608`.
- **Primary Color**: Orange (`#f97316`).
- **Utility Classes**: Defined in `src/index.css` (e.g., `.glass`, `.glow-orb`, `.card-float`, `.gradient-text`).
- **Mobile First**: All pages (Landing, Demo, Dashboard) must be fully responsive with a dedicated mobile hamburger menu.

## 3. Directory Map & Documentation

### 3.1 Documentation Index
- [**Developer Guide**](docs/DEVELOPER_GUIDE.md): Frontend standards, Tailwind v4 rules, Zustand usage, and deployment boundary notes.
- [**Architecture Principles**](docs/architecture/PRINCIPLES.md): Core UI/UX rules, Glassmorphism guidelines, Mobile First strategy, and shared identity constraints.
- [**Studio Integration Guide**](../../v-menu-backend/docs/architecture/STUDIO_FRONTEND_INTEGRATION.md): Mandatory rules for integrating the backend AI image processing task system (`StudioAsset`, `StylePreset`, `GenerationJob`, `GenerationVariant`).

### 3.2 Code Map
| Path | Description |
| :--- | :--- |
| `src/layouts/` | **MainLayout** (Marketing/Global), **DashboardLayout** (Console shell with nested routes). |
| `src/pages/` | `Landing.tsx` (Marketing), `Studio.tsx` (Creation Workspace), `dashboard/*` (Home/Create/Library/History/Referral/Settings). |
| `src/store/` | `authStore.ts` (session + wallet owner), `dashboardStore.ts` (dashboard aggregate owner). |
| `src/services/` | `api.ts` (Axios instance), `auth.ts` (Auth service wrappers). |
| `src/locales/` | `th.json`, `zh.json`, `en.json` (Keep keys strictly aligned). |
| `deploy/` | Docker & Nginx configurations (Isolated from Project 1). |

## 4. Development Constraints & Rules

1.  **Shared Identity First**: Never create local user tables. Consume `/auth/me` and respect the organization context.
2.  **No "Alien" Styles**: Maintain the Glassmorphism theme. Use CSS variables defined in `index.css` for new components.
3.  **Strict Type Safety**: No `any`. Use `AuthResponse`, `User`, and `Organization` interfaces from `src/types/auth.ts`.
4.  **Localization As Default**: New UI strings should go to `locales/*.json`. Existing hardcoded fallback text should be reduced over time rather than copied forward.
5.  **Mobile First**: Always verify `md:` and `sm:` breakpoints for new UI sections.
6.  **Verify, Don't Guess**: Run `npm run build` before finishing. Run `npm run lint` when touching routing, auth, or shared UI logic.

## 5. Deployment Notes

- **Gateway Boundary**: Public domain routing and TLS live under the shared gateway in `infra/nginx/`.
- **App Container Boundary**: Files under `deploy/` serve the app-local frontend container only.
- **Target Domain**: Current gateway examples target `www.menuth.com`, but runtime container names, ports, and cert readiness must follow the active deploy config rather than this file alone.

## 6. Frontend Visual & Interaction Design Principles (WYSIWYG)

为了确保后续的 AI 代理能够保持产品一致的高级视觉体验，请在开发任何新功能时严格遵循以下"所见即所得 (WYSIWYG)"与商业化体验规范，**坚决避免生成割裂、简陋或缺乏响应式的 UI 代码**：

### 6.1 核心体验原则：所见即所得 (WYSIWYG)
- **拒绝"两套皮"设计**：坚决摒弃"未登录看 Demo，已登录用后台"的割裂设计。未登录的游客必须看到与真实用户完全一致的生产力工具 UI（如真实的上传拖拽框、风格选择器等）。
- **优雅的动作拦截 (Action Interception)**：将注册/登录的引导无缝融入操作链路中。允许用户随意浏览和调整参数，但在尝试"拖拽释放图片"、"点击生成"等关键动作时，平滑地拦截并弹出登录引导。

### 6.2 视觉与动效 (Dark Glassmorphism & Micro-interactions) **[不可妥协的底线]**
- **暗黑毛玻璃基调**：坚决避免大面积纯色扁平块。背景基调为 `#060608`。大面积使用 `.glass` 和 `.glass-strong` 类，确保面板的通透感与层次感。
- **严格的材质与动画不可妥协 (No Compromise on Textures & Animations)**：产品的高级感来源于极其讲究的光影和毛玻璃材质。任何 AI 代理在新增或重构组件时，**绝对禁止**省略光影（`shadow-[0_0_...rgba(...)]`）、渐变背景、脉冲动画（`animate-pulse` / `animate-pulse-glow`）和模糊滤镜（`backdrop-blur-xl`）。不准以“简化代码”或“提高性能”为由将精美的毛玻璃退化为纯色（如 `bg-gray-800`）。
- **发光与呼吸 (Glow & Pulse)**：使用 `.glow-orb` 和 `.animate-pulse-glow` 为背景或核心 CTA 添加环境光晕，营造科技感。
- **平滑过渡**：广泛使用 `transition-all duration-300`、`hover:scale-[1.02]` 和 `.animate-slide-up`，确保每次悬停和状态切换都如丝般顺滑。
- **拒绝干瘪的"空状态"**：不要使用枯燥的 "暂无数据"。空状态是最好的营销位，**必须**完整保留原型 (`demo.html`) 中的四大演示能力：相机上传特效、Before/After 滤镜对比动效、AI 文案生成示例、以及多端社交分享排版。
- **禁止“越做越薄”**：新增页面或重构页面不能只有一排浅色玻璃卡片平铺了事。必须明确做出 `主英雄区 / 核心 CTA / 次级信息区 / 列表区` 的层级差异，至少保留一个强视觉主面板（如 `dashboard-surface-strong`）和一处环境光，否则会迅速退化成平庸后台。
- **色彩语义固定，不许漂移**：橙色只用于主行动、核心数字、收益/消费焦点；紫色只用于 AI/Studio/创意语义；绿色/青色只用于资产、完成态、成功反馈。禁止把所有功能卡都做成同等强度的彩色块，导致主次失焦。
- **页面记忆点优先于卡片堆叠**：Console 页面不能简单复制同一套 `bg-white/[0.035] + border-white/8 + rounded-[28px]` 到所有模块。主区必须有明显更强的材质、光感或构图；辅助区应回到中性玻璃层。

### 6.3 布局与国际化 (Adaptive & i18n Robustness)
- **自适应外壳 (Adaptive Shell)**：严格区分 Marketing Shell（全局导航+页脚）和 Console Shell（B2B控制台：侧边栏+无页脚）。禁止在控制台内混用营销页布局，确保沉浸式的应用体验。
- **控制台必须路由化，不准单文件切页**：Dashboard / Library / History / Referral / Settings 等控制台页面必须使用嵌套路由和布局层，不允许继续通过 `activeSection` 之类的本地状态在一个巨型页面内条件渲染所有内容。URL、返回栈、刷新恢复和代码边界都必须与页面结构一致。
- **大屏禁止人为收窄宽页面**：Library、History、Referral 这类信息密度高的控制台页面，禁止再被统一的 `max-w-5xl` 等窄容器限制出大片留白。布局宽度必须按页面语义区分，宽页面可使用 `max-w-none` 或更大的 `max-w-7xl`/自适应网格。
- **移动端优先与智能组件变形 (Mobile-First & Dynamic Island)**：这是最高级工程化要求。对于涉及状态机（如 Studio 生图）、复杂面板或长列表的页面，必须通过**响应式悬浮组件与状态变形**（例如：`DynamicActionIsland` 在移动端收缩为底部栏，在桌面端展开为底部中控台）来保证跨端一致性与极致体验。永远不要让用户在手机上看到重叠的滚动条或被截断的按钮。
- **国际化弹性尺寸**：因为需支持泰语和英语，其文本长度远超中文，**绝对禁止写死元素的固定宽度和高度**。必须使用弹性布局（Flex/Grid）和 `w-full`、`max-w-*` 确保文本不会溢出破坏布局。
- **Create / Home / Studio 的国际化必须完整**：这类主路径页面禁止遗留英文硬编码说明。工作流标题、描述、辅文、步骤标签都必须可被 TH / ZH / EN 切换，不允许只把按钮做成国际化。

### 6.4 商业化与防呆设计 (Commercial UX & Fool-proofing)
- **资产透明与防误导**：涉及消耗积分（Credits）的操作按钮旁，必须清晰美观地展示预估消耗（如带透明背景的 `10 cr` 标签）。不要将不同资产混合成一个让人困惑的总数，确保用户明确知道自己正在使用什么。
- **Pro/Growth 权限锁**：对于高级功能不要直接隐藏。展示它们但变暗，打上带锁的 "Pro" 徽章，并在悬停时平滑浮现升级提示，激发转化欲望。
- **动作锁定 (Action Locking)**：任何改变状态或消耗资产的操作（生成、兑换、登录）**必须**锁定 UI。按钮需进入 `disabled` 状态并带有 Loading 动画，坚决防止连点和并发请求。
- **语义化错误处理**：禁止向用户暴露 HTTP 500 或后端原生字段。业务错误必须被拦截并翻译为本地化、对用户友好的 Toast 提示。

---

## 7. Golden Rules for Agents

1.  **Respect the Prototype & Aesthetics [NO COMPROMISE]**: The UI is the core selling point. Do NOT simplify animations, glass effects, or layout flexibilities under ANY circumstances. Preserve all `.glass`, `.glow-orb`, shadow/blur effects, and gradient textures as defined in the HTML prototype.
2.  **No "Alien" Components**: Every new component must inherit the dark glassmorphism theme, support i18n without text overflow, and gracefully collapse on mobile devices.
3.  **Hierarchy Before Density**: A new console page is not complete unless it has an obvious hero hierarchy, clear CTA focus, and semantic color ownership. Flat card grids without focal depth are considered unfinished UI.
4.  **Strict Type Definition Alignment**: Frontend TypeScript interfaces MUST strictly mirror the backend JSON payload structures defined in `v-menu-backend/docs/openapi/README.md`. Never guess payload structures; always verify the nested object arrays (e.g., `response.data.assets` vs `response.data.summaries`).
5.  **Mandatory API Pre-computation**: Before writing UI logic that consumes a new API, you MUST confirm the exact response structure. Do not assume standard REST envelopes if the backend wraps data differently.
6.  **Infinite Loop Prevention**: 
    - NEVER blindly add dependencies to `useEffect` arrays to silence `react-hooks/exhaustive-deps` warnings.
    - NEVER add state-setting functions from Zustand stores (like `fetchWalletSummaries`) to dependency arrays if they trigger state updates that cause re-renders.
    - Always use `isMounted` flags or AbortControllers for async data fetching in `useEffect` to prevent memory leaks.
7.  **Verify, Don't Guess (Quality Gates)**: 
    - Unverified code = Broken code. 
    - You MUST run `npm run typecheck` AND `npm run lint:fix` after ANY structural change.
    - You are STRICTLY PROHIBITED from bypassing linter rules or suppressing TypeScript errors without fixing the underlying logical flaw.
