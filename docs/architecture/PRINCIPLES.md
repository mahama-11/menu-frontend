# V-Menu Architecture & UI Principles

This document outlines the core design philosophy and UI/UX constraints that define the `v-menu-frontend`. It may reuse lessons from `v-frontend`, but it should be treated as a sibling product frontend with its own routes, deploy layer, and product semantics.

## 1. UI Philosophy: Glassmorphism

The AI Menu Growth Engine employs a distinct visual style known as "Glassmorphism." This style is characterized by:
- **Dark Mode Native**: A very dark background (`#060608`) serves as the canvas for the bright, saturated colors of the food imagery.
- **Translucent Panels**: Panels use semi-transparent white backgrounds (`bg-white/5` or `bg-white/10`) coupled with backdrop blur to create a frosted glass effect.
- **Z-Axis Depth**: The interface relies on shadows, ambient glows (`.glow-orb`), and dynamic highlights to create a sense of physical thickness and hierarchy, rather than flat semi-transparent blocks.
- **Vibrant Accents**: A striking orange primary color (`#f97316`), alongside secondary accents (purple, blue, green), provides high contrast against the dark background.
- **Reactive Ambient Lighting**: Use of blurred, colored orbs (`.glow-orb`) placed strategically behind content blocks. These lights must react to system states (e.g., pulsing purple when AI is processing) to add life to the UI.

**Constraint**: All new components must adhere to this aesthetic. Avoid flat, solid-colored blocks. Instead, rely on the `.glass` and `.glass-strong` utility classes defined in `index.css`.

## 2. Interaction Design: The "Magic Studio" Approach

For creation workflows (like the AI Image Studio), the application abandons traditional "form-like" or "step-by-step" linear wizards in favor of a spatial, immersive experience.

- **Spatial Continuity**: The Canvas is the absolute center of the experience. It occupies 100% of the screen. Tools and controls must float above it as a "Dynamic Action Island" rather than pushing the canvas down.
- **Progressive Disclosure**: Controls should mutate and expand only when needed. For example, the Action Island starts as a small upload button, expands into a full control panel when an image is ready, and collapses into a loading pill during generation.
- **Defensive Design (Error Prevention & Guidance)**:
  - Do not let the user click a disabled "Generate" button without feedback. If a prerequisite (like selecting a style) is missing, visually downgrade the CTA (e.g., make it a ghost button) and add animations (like a shake or pulse ring) to guide the user's eye to the missing step.
  - "Empty States" on desktop must never be a blank screen. Use ambient backgrounds or inspiration galleries (Showcases) to fill the void and lower the onboarding barrier.

## 3. Adaptive Layout Strategy

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

## 7. Commercial & Referral UI/UX Standards

As a commercialized SaaS product, V-Menu enforces strict UX patterns for revenue-generating and growth features (like the Referral Program and Credits system):

### 7.1 Asset Transparency & Anti-Misleading
- **Multi-Asset Display**: Users hold different types of assets (Permanent Credits, Promo Credits, Monthly Allowances). The UI must never aggregate these into a single confusing number without explanation. Use tooltips (Hover) or explicit breakdowns to show the composition of their `balance`.
- **Referral Redemption**: When users earn commissions, they redeem them for **Reward Assets (Credits)**, not cash payouts. The UI copywriting (e.g., "Redeemed") must explicitly state "Redeemed to reward assets" to prevent users from thinking they can withdraw cash.
- **Rule Transparency**: Referral rules (delay days, repeat eligibility, specific reward conditions) returned by the `resolve` API must be clearly displayed on both the Register page (for the invitee) and the Referral Center (for the inviter).

### 7.2 Fool-proofing & State Consistency (防呆设计)
- **Action Locking (Loading States)**: Any action that mutates state or costs assets (Generate Code, Redeem Commission, AI Generation, Login/Register) MUST lock the UI. The button must enter a `disabled` state with a loading spinner to prevent double-submissions or network race conditions.
- **Semantic Error Handling**: Never expose raw HTTP status codes (like 500) or backend variable names to the user. All business errors (e.g., `REFERRAL_ALREADY_CLAIMED`, `REFERRAL_SELF_INVITE_BLOCKED`) must be caught by the global interceptor and translated into localized, user-friendly Toast messages.
- **Empty States (Call-to-Action)**: A page or feed should never just say "No Data". Every empty state must include a clear Call-to-Action (e.g., "Generate your first code", "Copy Link") to guide the user toward the intended behavior.
- **Auth Loophole Prevention**: If a user is already authenticated, visiting `/login` or clicking "Start Free Trial" on the landing page must automatically and silently redirect them to the `/dashboard` to maintain a continuous flow.
