import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import './styles.css';

installNeutralCmsDefaults();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
    <AdminCmsPanelsMount />
  </React.StrictMode>
);
