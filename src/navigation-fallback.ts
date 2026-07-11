const ROUTE_BY_LABEL: Record<string, string> = {
  'home': '/',
  'início': '/',
  'inicio': '/',
  'evento': '/evento',
  'ex-alunos': '/ex-alunos',
  'ex alunos': '/ex-alunos',
  'nossa história': '/nossa-historia',
  'nossa historia': '/nossa-historia',
  'curiosidades': '/curiosidades',
  'pós-festa': '/pos-festa',
  'pos-festa': '/pos-festa',
  'login/cadastro': '/login',
  'login / cadastro': '/login',
  'comprar ingresso': '/ingressos',
  'comprar agora': '/ingressos',
  'abrir página de ingressos': '/ingressos',
  'abrir pagina de ingressos': '/ingressos',
  'ver quem vai': '/quem-vai',
};

const KNOWN_ROUTES = new Set([
  '/',
  '/evento',
  '/ingressos',
  '/checkout',
  '/confirmacao',
  '/quem-vai',
  '/turma',
  '/ex-alunos',
  '/reivindicar-perfil',
  '/nossa-historia',
  '/nossa-historia/memorias',
  '/curiosidades',
  '/mapa',
  '/convite',
  '/meu-ingresso',
  '/pos-festa',
  '/minha-area',
  '/editar-perfil',
  '/admin',
  '/checkin',
  '/login',
  '/termos',
  '/privacidade',
]);

function normalizeLabel(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizePath(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

function sameOriginPathFromAnchor(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return null;

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const path = normalizePath(url.pathname);
    return KNOWN_ROUTES.has(path) ? path : null;
  } catch {
    return null;
  }
}

function routeFromContext(element: HTMLElement, label: string) {
  if (label === 'ver mais') {
    const sectionText = normalizeLabel(element.closest('section')?.textContent);
    if (sectionText.includes('data') && sectionText.includes('hora') && sectionText.includes('local')) return '/evento';
  }

  if (label === 'ver todos') {
    const panelText = normalizeLabel(element.closest('[data-home-alumni-overview-panel="true"]')?.textContent);
    if (panelText.includes('ex-alunos') || panelText.includes('turma em movimento')) return '/ex-alunos';

    const sectionText = normalizeLabel(element.closest('section')?.textContent);
    if (sectionText.includes('confirmados') || sectionText.includes('quem já está') || sectionText.includes('quem confirmou')) return '/ex-alunos';
    if (sectionText.includes('memórias') || sectionText.includes('nossa história')) return '/nossa-historia';
    if (sectionText.includes('ingressos')) return '/ingressos';
  }

  if (
    label === 'linha do tempo' ||
    label === 'memórias' ||
    label === 'memorias' ||
    label === 'enquetes' ||
    label === 'perfil' ||
    label === 'mapa da turma'
  ) {
    return '/curiosidades';
  }

  return ROUTE_BY_LABEL[label] ?? null;
}

function routeFromElement(element: HTMLElement) {
  if (element instanceof HTMLAnchorElement) {
    const anchorPath = sameOriginPathFromAnchor(element);
    if (anchorPath) return anchorPath;
  }

  const aria = normalizeLabel(element.getAttribute('aria-label'));
  if (aria.startsWith('início') || aria.startsWith('inicio')) return '/';

  const label = normalizeLabel(element.textContent || element.getAttribute('aria-label'));
  const exactRoute = ROUTE_BY_LABEL[label];
  if (exactRoute) return exactRoute;

  return routeFromContext(element, label);
}

function navigateWithApp(path: string) {
  const normalizedPath = normalizePath(path);
  if (!KNOWN_ROUTES.has(normalizedPath)) return;

  if (normalizePath(window.location.pathname) !== normalizedPath) {
    window.history.pushState({}, '', normalizedPath);
  }

  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function installNavigationFallback() {
  if (document.documentElement.dataset.hcNavigationFallback === 'true') return;
  document.documentElement.dataset.hcNavigationFallback = 'true';

  document.addEventListener(
    'click',
    event => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const interactive = target.closest<HTMLElement>('a, button, [role="button"]');
      if (!interactive) return;

      const route = routeFromElement(interactive);
      if (!route) return;

      event.preventDefault();
      event.stopPropagation();
      if ('stopImmediatePropagation' in event) event.stopImmediatePropagation();
      navigateWithApp(route);
    },
    true,
  );
}

installNavigationFallback();
