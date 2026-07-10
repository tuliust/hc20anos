import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles.css';
import { getApprovedMemories, getHomePageContent, getPeople, HOME_PAGE_CONTENT_DEFAULTS } from './lib/services';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const HOME_PATHS = new Set(['', '/', '/index.html']);

interface MemoryPreviewItem {
  text: string;
  author: string;
  classLabel: string;
}

function currentPathname() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
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

function findMemoryPreviewCard() {
  const cards = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
  return cards.find(card =>
    Array.from(card.querySelectorAll('p')).some(node => node.textContent?.trim().toLowerCase() === 'memórias')
  ) ?? null;
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

  const render = () => {
    if (!HOME_PATHS.has(currentPathname())) return;

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
      quote.textContent = '“As memórias da turma aparecerão aqui conforme forem publicadas.”';
      meta.textContent = 'Turma 2006';
      return;
    }

    const item = items[activeIndex % items.length];
    quote.textContent = `“${item.text}”`;
    meta.textContent = `${item.author} · ${item.classLabel}`;
  };

  const startAutoSlide = () => {
    if (intervalId || items.length <= 1) return;
    intervalId = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % items.length;
      render();
    }, 5200);
  };

  const loadItems = async () => {
    if (isLoading) return;
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
      render();
      startAutoSlide();
    }
  };

  const observer = new MutationObserver(() => {
    render();
    void loadItems();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  render();
  void loadItems();
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
}

void bootstrap();
