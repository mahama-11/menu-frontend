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

### 3.2 Code Map
| Path | Description |
| :--- | :--- |
| `src/layouts/` | **MainLayout** (Marketing/Global), **Dashboard** (Self-contained B2B layout). |
| `src/pages/` | `Landing.tsx` (Marketing), `Demo.tsx` (Interactive), `Dashboard.tsx` (B2B Console). |
| `src/store/` | `authStore.ts` (Zustand) - Single source of truth for Auth & User. |
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

---

## 6. Golden Rules for Agents

1.  **Respect the Prototype**: The UI is the core selling point. Do not simplify animations or glass effects unless requested.
2.  **Full-Stack Awareness**: When auth fails, check the interceptor logic in `api.ts` and the mapping in `authStore.ts`.
3.  **Document as You Go**: If you add a new route or service, update this `AGENTS.md` index.
