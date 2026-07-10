import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles.css';
import { getApprovedMemories, getHomePageContent, getPeople, HOME_PAGE_CONTENT_DEFAULTS } from './lib/services';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const HOME_PATHS = new Set(['', '/', '/index.html']);
const HOME_PROFESSOR_POLL_STORAGE_KEY = 'hc20anos:home-professor-poll-v1';
const HOME_PROFESSOR_POLL_BASE_VOTES: Record<string, number> = {
  Agamenon: 7,
  Adailton: 5,
  'Sérgio Trindade': 6,
};

interface MemoryPreviewItem {
  text: string;
  author: string;
  classLabel: string;
}

interface HomeProfessorPollState {
  selected?: string;
  votes?: Record<string, number>;
}

function currentPathname() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function isHomePath() {
  return HOME_PATHS.has(currentPathname());
}

function setTextIfChanged(element: HTMLElement | null, text: string) {
  if (!element || element.textContent === text) return;
  element.textContent = text;
}

async function preloadHomeContent() {
  const pathname = currentPathname();
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

function truncateMemoryText(value: string, maxLength = 190) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function findPreviewCardByLabel(label: string) {
  const normalizedLabel = label.trim().toLowerCase();
  const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
  return cards.find(card =>
    Array.from(card.querySelectorAll('p')).some(node => node.textContent?.trim().toLowerCase() === normalizedLabel)
  ) ?? null;
}

function findMemoryPreviewCard() {
  return findPreviewCardByLabel('memórias');
}

function createMemoryCarouselShell() {
  const shell = document.createElement('div');
  shell.dataset.homeMemoryCarousel = 'true';
  shell.className = 'min-h-[116px] flex flex-col justify-between gap-4 transition-opacity duration-500';

  const quote = document.createElement('p');
  quote.dataset.memoryText = 'true';
  quote.className = "font-['Playfair_Display'] text-[#f0ebe0] text-xl md:text-2xl font-bold leading-snug";

  const meta = document.createElement('p');
  meta.dataset.memoryMeta = 'true';
  meta.className = 'text-[#7a9a7a] text-xs font-mono uppercase tracking-[0.18em] leading-relaxed';

  shell.append(quote, meta);
  return shell;
}

function installHomeMemoryPreviewCarousel() {
  let items: MemoryPreviewItem[] = [];
  let activeIndex = 0;
  let isLoading = false;
  let intervalId: number | null = null;
  let scheduled = false;

  const render = () => {
    scheduled = false;
    if (!isHomePath()) return;

    const card = findMemoryPreviewCard();
    if (!card) return;

    const label = Array.from(card.querySelectorAll('p'))
      .find(node => node.textContent?.trim().toLowerCase() === 'memórias');
    if (!label) return;

    let shell = card.querySelector<HTMLDivElement>('[data-home-memory-carousel="true"]');

    if (!shell) {
      let next = label.nextElementSibling;
      while (next) {
        const current = next;
        next = next.nextElementSibling;
        current.remove();
      }
      shell = createMemoryCarouselShell();
      label.insertAdjacentElement('afterend', shell);
    }

    const quote = shell.querySelector<HTMLElement>('[data-memory-text="true"]');
    const meta = shell.querySelector<HTMLElement>('[data-memory-meta="true"]');
    if (!quote || !meta) return;

    if (!items.length) {
      setTextIfChanged(quote, '“As memórias da turma aparecerão aqui conforme forem publicadas.”');
      setTextIfChanged(meta, 'Turma 2006');
      return;
    }

    const item = items[activeIndex % items.length];
    setTextIfChanged(quote, `“${item.text}”`);
    setTextIfChanged(meta, `${item.author} · ${item.classLabel}`);
  };

  const scheduleRender = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  };

  const startAutoSlide = () => {
    if (intervalId || items.length <= 1) return;
    intervalId = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % items.length;
      scheduleRender();
    }, 5200);
  };

  const loadItems = async () => {
    if (isLoading || !isHomePath()) return;
    isLoading = true;

    try {
      const [memories, people] = await Promise.all([
        getApprovedMemories(DEFAULT_EVENT_ID),
        getPeople(),
      ]);
      const peopleById = new Map(people.map(person => [person.id, person]));

      items = memories.slice(0, 10).map(memory => {
        const person = memory.person_id ? peopleById.get(memory.person_id) : null;
        const author = memory.is_anonymous
          ? 'Autor(a) anônimo(a)'
          : memory.author_name || person?.display_name || person?.full_name || 'Ex-aluno(a)';
        const classLabel = person?.class_group ? `Turma ${person.class_group}` : 'Turma 2006';

        return {
          text: truncateMemoryText(memory.memory_text),
          author,
          classLabel,
        };
      });
    } catch {
      items = [];
    } finally {
      isLoading = false;
      scheduleRender();
      startAutoSlide();
    }
  };

  const observer = new MutationObserver(() => {
    scheduleRender();
    void loadItems();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  scheduleRender();
  void loadItems();
}

function loadHomeProfessorPollState(): HomeProfessorPollState {
  try {
    const raw = window.localStorage.getItem(HOME_PROFESSOR_POLL_STORAGE_KEY);
    if (!raw) return { votes: { ...HOME_PROFESSOR_POLL_BASE_VOTES } };
    const parsed = JSON.parse(raw) as HomeProfessorPollState;
    return {
      selected: parsed.selected,
      votes: { ...HOME_PROFESSOR_POLL_BASE_VOTES, ...(parsed.votes ?? {}) },
    };
  } catch {
    return { votes: { ...HOME_PROFESSOR_POLL_BASE_VOTES } };
  }
}

function saveHomeProfessorPollState(state: HomeProfessorPollState) {
  try {
    window.localStorage.setItem(HOME_PROFESSOR_POLL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignora falhas de localStorage em modo privado/restrito.
  }
}

function getHomeProfessorPollPercentages(votes: Record<string, number>) {
  const total = Object.values(votes).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) || 1;
  return Object.fromEntries(
    Object.entries(votes).map(([name, value]) => [name, Math.round((Math.max(0, Number(value) || 0) / total) * 100)])
  );
}

function createPollOptionControl(option: string, onVote: (option: string) => void) {
  const control = document.createElement('span');
  control.dataset.professorPollOption = option;
  control.role = 'button';
  control.tabIndex = 0;
  control.className = 'inline-flex items-center justify-center min-h-[42px] px-4 py-2 border border-[#2d6a4f]/40 text-[#f0ebe0] hover:border-[#c9a84c]/60 hover:bg-[#1a2e1a] transition-colors text-[11px] font-mono uppercase tracking-[0.14em] text-center';
  control.textContent = option;

  const vote = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    onVote(option);
  };

  control.addEventListener('click', vote);
  control.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    vote(event);
  });

  return control;
}

function createProfessorPollShell(onVote: (option: string) => void) {
  const shell = document.createElement('div');
  shell.dataset.homeProfessorPoll = 'true';
  shell.className = 'min-h-[116px] flex flex-col justify-between gap-4';

  const question = document.createElement('p');
  question.dataset.professorPollQuestion = 'true';
  question.className = "font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold mb-1 leading-tight";
  question.textContent = 'Qual professor te marcou?';

  const options = document.createElement('div');
  options.dataset.professorPollOptions = 'true';
  options.className = 'grid grid-cols-1 gap-2';

  ['Agamenon', 'Adailton', 'Sérgio Trindade'].forEach(option => {
    options.appendChild(createPollOptionControl(option, onVote));
  });

  shell.append(question, options);
  return shell;
}

function installHomeProfessorPollPreview() {
  let state = loadHomeProfessorPollState();
  let scheduled = false;

  const render = () => {
    scheduled = false;
    if (!isHomePath()) return;

    const card = findPreviewCardByLabel('enquetes');
    if (!card) return;

    const label = Array.from(card.querySelectorAll('p'))
      .find(node => node.textContent?.trim().toLowerCase() === 'enquetes');
    if (!label) return;

    let shell = card.querySelector<HTMLDivElement>('[data-home-professor-poll="true"]');

    if (!shell) {
      let next = label.nextElementSibling;
      while (next) {
        const current = next;
        next = next.nextElementSibling;
        current.remove();
      }
      shell = createProfessorPollShell(option => {
        if (state.selected) return;
        const votes = { ...HOME_PROFESSOR_POLL_BASE_VOTES, ...(state.votes ?? {}) };
        votes[option] = (votes[option] ?? 0) + 1;
        state = { selected: option, votes };
        saveHomeProfessorPollState(state);
        scheduleRender();
      });
      label.insertAdjacentElement('afterend', shell);
    }

    const votes = { ...HOME_PROFESSOR_POLL_BASE_VOTES, ...(state.votes ?? {}) };
    const percentages = getHomeProfessorPollPercentages(votes);

    shell.querySelectorAll<HTMLElement>('[data-professor-poll-option]').forEach(control => {
      const option = control.dataset.professorPollOption ?? '';
      const hasSelected = Boolean(state.selected);
      const text = hasSelected ? `${percentages[option] ?? 0}%` : option;
      setTextIfChanged(control, text);
      control.setAttribute('aria-label', hasSelected ? `${option}: ${percentages[option] ?? 0}% dos votos` : option);
      control.classList.toggle('border-[#c9a84c]/70', state.selected === option);
      control.classList.toggle('text-[#c9a84c]', state.selected === option);
    });
  };

  const scheduleRender = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  };

  const observer = new MutationObserver(scheduleRender);
  observer.observe(document.body, { childList: true, subtree: true });
  scheduleRender();
}

function createInlineIcon(name: 'graduation-cap' | 'baby' | 'venus') {
  const span = document.createElement('span');
  span.className = 'text-[#c9a84c] shrink-0 inline-flex items-center justify-center';
  const paths: Record<typeof name, string> = {
    'graduation-cap': '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/>',
    baby: '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 1 1-14 0"/><path d="M9 5a3 3 0 0 1 6 0"/>',
    venus: '<circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M8 17h8"/>',
  };
  span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
  return span;
}

function clearCardAfterLabel(labelElement: Element, shellSelector: string, createShell: () => HTMLElement) {
  let shell = labelElement.parentElement?.querySelector<HTMLElement>(shellSelector) ?? null;
  if (shell) return shell;

  let next = labelElement.nextElementSibling;
  while (next) {
    const current = next;
    next = next.nextElementSibling;
    current.remove();
  }

  shell = createShell();
  labelElement.insertAdjacentElement('afterend', shell);
  return shell;
}

function createProfileStatsShell() {
  const shell = document.createElement('div');
  shell.dataset.homeProfileStats = 'true';
  shell.className = 'min-h-[116px] grid grid-cols-1 gap-2';

  const stats: Array<{ icon: 'graduation-cap' | 'baby' | 'venus'; value: string; label: string }> = [
    { icon: 'graduation-cap', value: '5%', label: 'trabalham na área do Direito' },
    { icon: 'baby', value: '40%', label: 'tem filhos' },
    { icon: 'venus', value: '55%', label: 'são mulheres' },
  ];

  stats.forEach(stat => {
    const box = document.createElement('div');
    box.className = 'flex items-center gap-3 border border-[#2d6a4f]/30 bg-[#0d1a0f]/70 px-3 py-2';

    const value = document.createElement('p');
    value.className = "font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-black leading-none min-w-[46px]";
    value.textContent = stat.value;

    const label = document.createElement('p');
    label.className = 'text-[#7a9a7a] text-[11px] leading-tight';
    label.textContent = stat.label;

    box.append(createInlineIcon(stat.icon), value, label);
    shell.appendChild(box);
  });

  return shell;
}

function createMapChartShell() {
  const shell = document.createElement('div');
  shell.dataset.homeMapChart = 'true';
  shell.className = 'min-h-[116px] flex flex-col justify-between gap-3';

  const rows = [
    { label: 'Natal', value: 57 },
    { label: 'Interior', value: 12 },
    { label: 'Outro estado', value: 25 },
    { label: 'Fora do país', value: 6 },
  ];

  rows.forEach(row => {
    const item = document.createElement('div');
    item.className = 'grid grid-cols-[auto_1fr_auto] items-center gap-3';

    const label = document.createElement('p');
    label.className = 'text-[#7a9a7a] text-[11px] font-mono uppercase tracking-[0.12em] min-w-[92px]';
    label.textContent = row.label;

    const track = document.createElement('div');
    track.className = 'h-2 bg-[#0d1a0f] border border-[#2d6a4f]/25 overflow-hidden';

    const bar = document.createElement('div');
    bar.className = 'h-full bg-[#c9a84c]/80';
    bar.style.width = `${row.value}%`;
    track.appendChild(bar);

    const value = document.createElement('p');
    value.className = 'text-[#f0ebe0] text-xs font-mono tabular-nums min-w-[34px] text-right';
    value.textContent = `${row.value}%`;

    item.append(label, track, value);
    shell.appendChild(item);
  });

  return shell;
}

function installHomeProfileAndMapPreview() {
  let scheduled = false;

  const render = () => {
    scheduled = false;
    if (!isHomePath()) return;

    const chartCard = findPreviewCardByLabel('gráficos');
    chartCard?.remove();

    const profileCard = findPreviewCardByLabel('perfil');
    const profileLabel = profileCard
      ? Array.from(profileCard.querySelectorAll('p')).find(node => node.textContent?.trim().toLowerCase() === 'perfil')
      : null;
    if (profileLabel) clearCardAfterLabel(profileLabel, '[data-home-profile-stats="true"]', createProfileStatsShell);

    const mapCard = findPreviewCardByLabel('mapa da turma');
    const mapLabel = mapCard
      ? Array.from(mapCard.querySelectorAll('p')).find(node => node.textContent?.trim().toLowerCase() === 'mapa da turma')
      : null;
    if (mapLabel) clearCardAfterLabel(mapLabel, '[data-home-map-chart="true"]', createMapChartShell);
  };

  const scheduleRender = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(render);
  };

  const observer = new MutationObserver(scheduleRender);
  observer.observe(document.body, { childList: true, subtree: true });
  scheduleRender();
}

async function bootstrap() {
  await preloadHomeContent();

  createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  installHeroScrollBehavior();
  installHomeMemoryPreviewCarousel();
  installHomeProfessorPollPreview();
  installHomeProfileAndMapPreview();
}

void bootstrap();