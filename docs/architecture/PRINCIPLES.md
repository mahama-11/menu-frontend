# V-Menu Architecture & UI Principles

This document outlines the core design philosophy and UI/UX constraints that define the `v-menu-frontend`. It may reuse lessons from `v-frontend`, but it should be treated as a sibling product frontend with its own routes, deploy layer, and product semantics.

## 1. UI Philosophy: Glassmorphism

The AI Menu Growth Engine employs a distinct visual style known as "Glassmorphism." This style is characterized by:
- **Dark Mode Native**: A very dark background (`#060608`) serves as the canvas for the bright, saturated colors of the food imagery.
- **Translucent Panels**: Panels use semi-transparent white backgrounds (`bg-white/5` or `bg-white/10`) coupled with backdrop blur to create a frosted glass effect.
- **Vibrant Accents**: A striking orange primary color (`#f97316`), alongside secondary accents (purple, blue, green), provides high contrast against the dark background.
- **Ambient Lighting**: Use of blurred, colored orbs (`.glow-orb`) placed strategically behind content blocks to add depth and warmth to the UI.

**Constraint**: All new components must adhere to this aesthetic. Avoid flat, solid-colored blocks. Instead, rely on the `.glass` and `.glass-strong` utility classes defined in `index.css`.

## 2. Adaptive Layout Strategy

We borrow the concept of the "Adaptive Shell" from the parent project, applying it to our specific needs:

- **Marketing Shell (MainLayout)**: Used for `Landing.tsx`, `Demo.tsx`, and authentication pages. It features a sticky global navigation bar and a standard footer.
- **Console Shell (Dashboard)**: A fully contained, application-style layout. It features a fixed sidebar on desktop and a sticky top bar on mobile. It intentionally drops the global marketing footer to maximize vertical space for the working area.

**Constraint**: Never mix the layouts. A logged-in user inside the Dashboard should feel like they are inside a dedicated app, not a website.

## 3. Mobile First Execution

Mobile responsiveness is not an afterthought; it is the primary focus. F&B owners will likely use this tool on their phones or tablets in their restaurants.

- **Navigation**: The desktop navigation bar is completely hidden on small screens (`sm:`), replaced by a hamburger menu that toggles a full-width overlay.
- **Grids**: Ensure all CSS grids (`grid-cols-*`) collapse gracefully to 1 or 2 columns on mobile devices.
- **Touch Targets**: All interactive elements (buttons, language selectors, feature cards) must have an adequate touch area and visible active/focus states.

## 4. Shared Identity & Entitlement

V-Menu is an independent product that shares the underlying identity infrastructure of the `v-backend`.

- **Authentication Flow**: The frontend currently connects to shared backend endpoints such as `/api/v1/auth/login`, `/api/v1/auth/register`, and `/api/v1/auth/me`.
- **Token Management**: The JWT `access_token` returned upon successful login is stored locally and injected into all subsequent API requests via the Axios interceptor.
- **Entitlement Checks (Product Boundary)**:
  - Just because a user is logged in does not mean they have access to the AI Menu Engine.
  - The `authStore.ts` explicitly checks the user's active organization for the `menu_ai` entitlement.
  - If a user lacks the entitlement, the `ProtectedRoute` component currently blocks the dashboard and renders an inline "Access Denied" guard state.

**Constraint**: Never bypass the `hasMenuAccess` check in the `ProtectedRoute`. If entitlement behavior changes, update both the UI guard and the product-boundary docs together.

## 5. Internationalization (i18n) Completeness

The target market for this MVP is Thailand, meaning tri-lingual support (Thai, English, Simplified Chinese) is mandatory.

- **Dynamic Loading**: Language switching must happen instantly without a page reload, handled seamlessly by `react-i18next`.
- **Key Alignment**: The dictionary structure in `src/locales/` must be flat and semantic (e.g., `dash.action.generate`, `hero.title`).
- **Layout Robustness**: Thai and English strings are often much longer than their Chinese counterparts. All UI components (buttons, cards) must use flexible widths (`w-full`, `max-w-*`) and avoid hardcoded pixel dimensions to prevent text overflow.

## 6. Accessibility (a11y) Standards

We do not sacrifice accessibility for the sake of aesthetics.

- **Semantic HTML**: Interactive elements must be `<button>` or `<a>`. Do not use `<div>` with an `onClick` handler unless it also receives a `role="button"` and `tabIndex={0}`.
- **Focus Outlines**: The default browser focus ring is often hidden by our custom styles. You must explicitly provide a focus state, typically using `focus:outline-none focus:ring-2 focus:ring-primary-500`.
- **Contrast**: Ensure text on top of glass panels or glow orbs remains legible.
