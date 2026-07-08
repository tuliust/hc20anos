import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles.css';
import './lib/ticket-enhancements-runtime';
import './lib/profile-registration-runtime';
import './lib/edit-profile-runtime';
import './lib/edit-profile-avatar-runtime';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
