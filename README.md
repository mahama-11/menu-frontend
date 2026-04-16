# v-menu-frontend

## AI Menu Growth Engine Frontend

This is the production-grade frontend project for the AI Menu Growth Engine, adhering to the workspace architectural guidelines.

### Tech Stack
- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- React Router DOM v6
- Axios (for API Client)
- i18next (for Localization)

### Quick Start
1. Install dependencies
```bash
npm install
```

2. Start dev server
```bash
npm run dev
```

3. Build for production
```bash
npm run build
```

### Architecture
- **Routing**: Client-side routing with `react-router-dom`.
- **Localization**: Uses `react-i18next` with JSON files in `src/locales/`.
- **Theming**: Dark mode support via standard Tailwind CSS `.dark` class, managed in `useThemeMode` hook.
- **Styling**: Tailwind CSS v4 configured with custom CSS variables in `src/index.css` following shadcn/ui patterns.
- **API**: Centralized Axios client in `src/services/api.ts`.
