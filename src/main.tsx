import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import './styles.css';
import './mobile.css';
import './mobile-a11y.css';
import './mobile-touch-targets.css';

installNeutralCmsDefaults();
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
    <AdminCmsPanelsMount />
    <PublicCmsStrictGuard />
  </React.StrictMode>
);
