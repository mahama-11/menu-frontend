# V-Menu Frontend Architecture & Skeleton Overview

## 1. Core Tech Stack
- **Framework**: React 19 + Vite + TypeScript (Strict Mode)
- **Routing**: React Router v7
- **State Management**: Zustand (e.g., `authStore`, `dashboardStore`, `studioStore`)
- **Styling**: Tailwind CSS v4 (Build-time extraction, CSS variables in `index.css` `@theme`)
- **API Client**: Axios with interceptors for global Auth injection and semantic error translation.
- **i18n**: `react-i18next` (Supports TH, EN, ZH)

## 2. Directory Structure Map
- **`src/components/`**: Reusable UI components (e.g., `ProtectedRoute`, `Toast`, `upload/`, `style/`).
- **`src/hooks/`**: Custom React hooks (e.g., `useI18n`, `useIsMobile`).
- **`src/layouts/`**: Page layout wrappers implementing the Adaptive Shell (`MainLayout`, `DashboardLayout`).
- **`src/locales/`**: JSON dictionaries for internationalization (`en.json`, `th.json`, `zh.json`).
- **`src/pages/`**: Route entry components (`Landing`, `Login`, `Studio`, `dashboard/*`).
- **`src/router/`**: React Router configuration.
- **`src/services/`**: API wrappers (`api.ts`, `auth.ts`, `studio.ts`).
- **`src/store/`**: Zustand global stores.
- **`src/types/`**: TypeScript interfaces reflecting backend payloads (`auth.ts`, `studio.ts`, `wallet.ts`).

## 3. Key Architectural Implementations
1. **Shared Identity & Entitlement (Auth Store)**: 
   - Relies on shared backend endpoints (`/auth/login`, `/auth/me`).
   - The `authStore.ts` stores session data and checks for the `menu_ai` entitlement before allowing access to protected routes via `ProtectedRoute.tsx`.
2. **Semantic Error Handling**:
   - The global Axios interceptor (`services/api.ts`) catches business errors (e.g., `error_code: REFERRAL_ALREADY_CLAIMED`).
   - It directly translates these codes into user-friendly messages using `i18n.t()`, removing the need for redundant `try-catch` parsing in individual UI components.
3. **State Management**:
   - Complex state like multi-asset balances and AI Generation Jobs are decoupled from React Context and managed via lightweight Zustand stores (`authStore.ts` and `studioStore.ts`), improving render performance.
4. **Action Locking (Commercial UX)**:
   - Button actions that consume credits or mutate state are designed to lock the UI (disabled + loading spinner) to prevent duplicate requests and race conditions.

## 4. Known Architectural Drifts & Action Items
- **API Client Boundaries**: `DEVELOPER_GUIDE.md` specifies separating `platformApiClient` and `menuApiClient`. However, currently `api.ts` maps both to `menuApiClient`. If the backend gateway handles this seamlessly, the documentation should be updated. If they are meant to be separate microservices, the frontend needs to instantiate a dedicated `platformApiClient` for Auth and Org flows.
- **Style Convergence**: Some legacy `.css` files remain (like `App.css`), but the project aims to converge all styles into `index.css` via Tailwind v4 utility classes and `@theme` configurations.
