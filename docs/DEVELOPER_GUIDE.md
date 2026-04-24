# V-Menu Developer Guide

This guide establishes the coding standards, project structure, and best practices for the `v-menu-frontend` project. It is a sibling product frontend under the shared workspace, not a visual sub-module of `v-frontend`. It reuses shared identity contracts while keeping its own UI system, deploy config, and product routes.

## 1. Core Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Routing**: React Router v7
- **HTTP Client**: Axios with Interceptors
- **i18n**: `react-i18next`

## 2. Project Structure

```text
v-menu-frontend/
├── deploy/            # Dockerfiles, Nginx conf, deploy scripts
├── src/
│   ├── assets/        # Static images (e.g., thai food samples)
│   ├── components/    # Reusable UI components (e.g., ProtectedRoute)
│   ├── hooks/         # Custom React hooks (e.g., useI18n)
│   ├── layouts/       # Page wrappers (e.g., MainLayout for marketing)
│   ├── locales/       # i18n JSON dictionaries (en.json, zh.json, th.json)
│   ├── pages/         # Route entry components (Landing, Demo, Dashboard)
│   ├── services/      # Axios client and API wrappers (api.ts, auth.ts)
│   ├── store/         # Zustand global stores (authStore.ts)
│   ├── types/         # TypeScript interfaces (auth.ts)
│   ├── App.tsx        # Root component and global effects
│   ├── index.css      # Tailwind v4 @theme and global utility classes
│   └── main.tsx       # React DOM entry point
└── .env               # Environment variables (VITE_API_BASE_URL)
```

## 3. Styling & Tailwind v4 Rules

Unlike `v-frontend` which uses a CDN runtime, `v-menu-frontend` uses the modern **Tailwind v4 build pipeline**.

### 3.1 CSS Variables & Theming

- Do not use `tailwind.config.js`. All theme customizations (colors, animations) must be defined in `src/index.css` using the `@theme` directive.
- **Semantic Colors**: Use `bg-primary-500` instead of hex codes. The primary color is mapped to orange (`#f97316`).
- **Dark Mode Default**: The app is inherently dark (`#060608` background). You do not need to prefix everything with `dark:`, but you must ensure contrast ratios are respected.

### 3.2 Utility Classes

- Complex, reusable visual effects (like the Glassmorphism panels or floating animations) are abstracted into custom utility classes in `index.css`:
  - `.glass`: Standard semi-transparent panel with a subtle border.
  - `.glass-strong`: Darker, more opaque panel for high-contrast areas (like headers).
  - `.glow-orb`: Background blurred circles for ambiance.
  - `.animate-slide-up`, `.animate-pulse-glow`: Custom keyframe animations.

## 4. State Management (Zustand)

Do not use React Context for complex global state. We use **Zustand** for its simplicity and performance.

### 4.1 Auth Store (`src/store/authStore.ts`)

- Responsible for holding the `User` object, JWT `token`, `activeOrgId`, and `walletSummaries` (multi-asset balances).
- **Entitlement Checks**: The store automatically computes `hasMenuAccess` by checking if the user's active organization has the `menu_ai` entitlement.
- **Persistence**: Tokens and active orgs are synced to `localStorage`.
- **Loading State**: The app root correctly mounts and uses `fetchUser()` and `fetchWalletSummaries()` to restore session state silently before rendering the main protected routes to prevent infinite loading spinners.

## 5. API & Error Handling (`src/services/api.ts`)

- **Never use raw `fetch`**. Always use the exported `apiClient` or `menuApiClient` from `src/services/api.ts`.
- **Interceptors & Semantic Error Handling**:
  - Automatically injects the Bearer token.
  - Intercepts `401 Unauthorized` and clears the Zustand store before redirecting to `/login`.
  - **Global 403 & 429 Handling**: Automatically intercepts forbidden and rate-limited requests to prevent UI crashes.
  - **Semantic Error Translation**: When the backend returns a specific `error_code` (e.g., `REFERRAL_ALREADY_CLAIMED`), the interceptor automatically maps it to a localized string via `i18n.t('err.ERROR_CODE')`. This allows frontend UI components to simply `catch(err)` and `showToast(err.message)` without writing any custom error mapping logic.
  - **Data Unwrapping**: The interceptor handles the Go backend's standard response format (`{ code, data, message }`). It treats both `code: 0` and `code: 200` as success and returns the inner `data`.
- **Shared Auth Boundary**:
  - Current auth calls point at shared backend endpoints such as `/auth/login`, `/auth/register`, `/auth/me`, and `/orgs/switch`.
  - Do not introduce product-local identity truth. If auth shape changes, update this project together with the shared backend contract docs.

## 6. Internationalization (i18n)

- **Default Rule**: New UI should not add hardcoded English, Chinese, or Thai strings in JSX.
- **Hooks**: Use `const { t, lang } = useI18n()` to retrieve translations and the current language code.
- **Dictionary Alignment**: If you add a key to `en.json`, you **must** add the exact same key to `zh.json` and `th.json`.
- **Naming Convention**: Group keys logically by page or component (e.g., `nav.login`, `hero.title`, `dash.credits`).
- **Current Gap**: Treat localization completeness as an active cleanup target. Existing fallback or guard-page hardcoded text should be extracted when the touched area is edited.

## 7. Quality Gates (DoD)

Before committing code, you must ensure:

1. **Lint**: Run `npm run lint` and fix any actionable issues.
2. **Build Success**: Run `npm run build`. The current build already includes TypeScript compilation via `tsc -b` before Vite bundling.
3. **Accessibility (a11y)**: Ensure all interactive elements (`button`, `a`) have visible focus states (e.g., `focus:ring-2 focus:ring-primary-500`). Do not use `div` for clickable actions.

## 8. Deployment Boundary

- **Public Gateway**: Domain routing, TLS, and cross-project reverse proxy rules belong to `infra/nginx/`.
- **Do Not Mix Layers**: Do not reintroduce `/api`, storage, or monitoring gateway rules back into the app-local frontend container configs.
- **API Split**:
  - `VITE_PLATFORM_API_BASE_URL` defaults to `/api/platform/v1`
  - `VITE_MENU_API_BASE_URL` defaults to `/api/menu/v1`
  - Auth and org flows should use the platform API client, not the menu API client.

## 9. Current Studio & Dashboard Facts

- **Active Studio Route**: `/studio` currently mounts `src/pages/Studio.tsx` -> `src/pages/studio/StudioLayout.tsx`. `StudioDesktop.tsx` and `StudioMobile.tsx` still exist in the repo as alternate shells / in-progress variants, but they are not the route-mounted workspace for the main Studio entry.
- **Studio Asset URLs**: frontend should treat backend-returned `source_url` / `preview_url` as browser-consumable URLs. Under the current backend contract these are Menu-owned signed content URLs for platform-stored assets, not public platform `/storage/*` paths and not third-party provider URLs.
- **Studio Polling**: generation job polling must stop on terminal states (`completed`, `failed`, `canceled`) and should also stop after repeated transport failures. Do not reintroduce infinite component-local polling loops without retry limits.
- **Dashboard Channel Surface**: current dashboard route tree now includes `/dashboard/channel` and nested pages for overview, commissions, settlements, current binding, preview, and adjustments. Frontend contract owners should keep `src/services/channel.ts` and `src/types/channel.ts` aligned with backend channel payloads.
