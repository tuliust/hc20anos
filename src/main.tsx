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

function installHeroScrollBehavior() {
  const enhanceScrollTrigger = () => {
    const trigger = document.querySelector('.animate-bounce');
    if (!(trigger instanceof HTMLElement)) return;
    if (!trigger.closest('section')) return;

    trigger.setAttribute('role', 'button');
    trigger.setAttribute('tabindex', '0');
    trigger.setAttribute('aria-label', 'Ir para a próxima seção');
    trigger.style.cursor = 'pointer';
  };

  const scrollToNextSection = (trigger: Element) => {
    const currentSection = trigger.closest('section');
    const nextSection = currentSection?.nextElementSibling;
    if (!(nextSection instanceof HTMLElement)) return;

    const headerOffset = 64;
    const top = nextSection.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest('.animate-bounce');
    if (!trigger?.closest('section')) return;

    event.preventDefault();
    scrollToNextSection(trigger);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target;
    if (!(target instanceof Element)) return;

    const trigger = target.closest('.animate-bounce');
    if (!trigger?.closest('section')) return;

    event.preventDefault();
    scrollToNextSection(trigger);
  };

  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);

  enhanceScrollTrigger();
  const observer = new MutationObserver(enhanceScrollTrigger);
  observer.observe(document.body, { childList: true, subtree: true });
}

async function bootstrap() {
  await preloadHomeContent();

  createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  installHeroScrollBehavior();
}

void bootstrap();
