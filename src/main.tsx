import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles.css';
import { getHomePageContent, HOME_PAGE_CONTENT_DEFAULTS } from './lib/services';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const HOME_PATHS = new Set(['', '/', '/index.html']);

async function preloadHomeContent() {
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  if (!HOME_PATHS.has(pathname)) return;

  try {
    const content = await getHomePageContent(DEFAULT_EVENT_ID);
    Object.assign(HOME_PAGE_CONTENT_DEFAULTS, content);
  } catch {
    // Mantém o fallback apenas se o conteúdo editado não puder ser carregado.
  }
}

async function bootstrap() {
  await preloadHomeContent();

  createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
