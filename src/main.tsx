import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './router';
import './index.css';
import './locales/i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
