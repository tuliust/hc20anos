import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Baby, GraduationCap, UserCheck, Users, Venus } from 'lucide-react';
import App from './app/App';
import './styles.css';
import { supabase } from './lib/supabase';
import { getApprovedMemories, getHomePageContent, getPeople, HOME_PAGE_CONTENT_DEFAULTS } from './lib/services';
import type { DbMemory, DbPerson } from './lib/database.types';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const HOME_PATHS = new Set(['', '/', '/index.html']);
const HOME_PROFESSOR_POLL_STORAGE_KEY = 'hc20anos:home-professor-poll-v1';
const HOME_PROFESSOR_POLL_BASE_VOTES: Record<string, number> = {
  Agamenon: 7,
  Adailton: 5,
  'Sérgio Trindade': 6,
};

const HOME_NOSTALGIA_TIMELINE = [
  {
    year: '1995',
    visual: '☎',
    title: 'Orelhão pra ligar pra casa',
    description: 'Ainda na nossa época de alfabetização, o normal ainda era usar o orelhão para ligar pra casa.',
  },
  {
    year: '1996',
    visual: 'Cadê?',
    title: 'Internet discada e Cadê?',
    description: 'Quando entramos na 1ª série, começava-se a era da internet discada e das buscas no site Cadê?.',
  },
  {
    year: '1999',
    visual: 'ICQ',
    title: 'mIRC e ICQ',
    description: 'Na 4ª série, começaram os tempos de mIRC e ICQ.',
  },
  {
    year: '2000',
    visual: 'MSN',
    title: 'MSN Messenger',
    description: 'Boa parte do nosso Ensino Fundamental foi conversando pelo MSN Messenger.',
  },
  {
    year: '2003',
    visual: '📱',
    title: 'Nokia e SMS',
    description: 'Na 8ª série, passamos a mandar SMS com nossos Nokias.',
  },
  {
    year: '2004',
    visual: 'ORK',
    title: 'Orkut e Fotolog',
    description: 'No Ensino Médio, Orkut e Fotolog marcaram para sempre nossas vidas.',
  },
];

const HOME_MAP_STATS = [
  { label: 'Natal', value: 57 },
  { label: 'Interior', value: 12 },
  { label: 'Outro estado', value: 25 },
  { label: 'Fora do país', value: 6 },
];

const HOME_ALUMNI_CLASS_GROUPS = ['A', 'B', 'C', 'D'];

function currentPathname() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function isHomePath() {
  return HOME_PATHS.has(currentPathname());
}

async function preloadHomeContent() {
  if (!isHomePath()) return;

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
  window.setTimeout(enhanceScrollTrigger, 250);
}

function truncateHomePreviewText(value: string, maxLength = 190) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function findPreviewCardByLabel(label: string) {
  const normalizedLabel = label.trim().toLowerCase();
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[role="button"], button'));
  return cards.find(card =>
    Array.from(card.querySelectorAll('p')).some(node => node.textContent?.trim().toLowerCase() === normalizedLabel)
  ) ?? null;
}

function findCardLabel(card: HTMLElement, label: string) {
  const normalizedLabel = label.trim().toLowerCase();
  return Array.from(card.querySelectorAll('p'))
    .find(node => node.textContent?.trim().toLowerCase() === normalizedLabel) ?? null;
}

function mountAfterLabel(card: HTMLElement, labelText: string, element: React.ReactNode, options?: { removeLabel?: boolean }) {
  const label = findCardLabel(card, labelText);
  if (!label) return false;

  let next = label.nextElementSibling;
  while (next) {
    const current = next;
    next = next.nextElementSibling;
    current.remove();
  }

  const mount = document.createElement('div');
  mount.dataset.homePreviewReactMount = labelText;
  if (options?.removeLabel) {
    label.insertAdjacentElement('beforebegin', mount);
    label.remove();
  } else {
    label.insertAdjacentElement('afterend', mount);
  }

  createRoot(mount).render(<>{element}</>);
  return true;
}

function removePreviewCard(label: string) {
  const card = findPreviewCardByLabel(label);
  card?.remove();
}

function replaceLeftStatsWithTimeline() {
  const statLabel = Array.from(document.querySelectorAll('p'))
    .find(node => node.textContent?.trim().toLowerCase() === 'ex-alunos na base');
  if (!statLabel) return false;

  let grid = statLabel.parentElement;
  while (grid && !String(grid.className).includes('grid-cols-3')) grid = grid.parentElement;
  if (!grid || grid.querySelector('[data-home-nostalgia-timeline="true"]')) return false;

  const mount = document.createElement('div');
  mount.dataset.homeNostalgiaTimeline = 'true';
  mount.className = 'mb-8';
  grid.replaceWith(mount);
  createRoot(mount).render(<HomeNostalgiaTimeline />);
  return true;
}

function HomeNostalgiaTimeline() {
  return (
    <div className="mt-8 border border-[#2d6a4f]/25 bg-[#141f14] p-5 md:p-6">
      <div className="relative ml-5 border-l border-[#2d6a4f]/35 pl-8">
        {HOME_NOSTALGIA_TIMELINE.map((item, index) => (
          <div key={item.year} className={index < HOME_NOSTALGIA_TIMELINE.length - 1 ? 'relative pb-7' : 'relative'}>
            <div className="absolute -left-[54px] top-0 w-10 h-10 rounded-full border border-[#2d6a4f]/50 bg-[#0d1a0f] text-[#c9a84c] flex items-center justify-center text-[11px] font-mono font-bold text-center leading-none">
              {item.visual}
            </div>
            <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.24em] mb-1">{item.year}</p>
            <p className="font-['Playfair_Display'] text-[#f0ebe0] text-xl font-bold leading-tight mb-2">{item.title}</p>
            <p className="text-[#7a9a7a] text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeMemoryPreviewContent({ memories, people }: { memories: DbMemory[]; people: DbPerson[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const peopleById = new Map(people.map(person => [person.id, person]));
  const items = memories.slice(0, 10).map(memory => {
    const person = memory.person_id ? peopleById.get(memory.person_id) : null;
    const author = memory.is_anonymous
      ? 'Autor(a) anônimo(a)'
      : memory.author_name || person?.display_name || person?.full_name || 'Ex-aluno(a)';
    const classLabel = person?.class_group ? `Turma ${person.class_group}` : 'Turma 2006';

    return {
      id: memory.id,
      text: truncateHomePreviewText(memory.memory_text),
      author,
      classLabel,
    };
  });

  useEffect(() => {
    if (items.length <= 1) return;
    const id = window.setInterval(() => setActiveIndex(index => (index + 1) % items.length), 5200);
    return () => window.clearInterval(id);
  }, [items.length]);

  const activeItem = items.length ? items[activeIndex % items.length] : null;

  return (
    <div className="min-h-[116px] flex flex-col justify-between gap-4">
      <p className="font-['Playfair_Display'] text-[#f0ebe0] text-xl md:text-2xl font-bold leading-snug">
        {activeItem ? `“${activeItem.text}”` : '“As memórias da turma aparecerão aqui conforme forem publicadas.”'}
      </p>
      <p className="text-[#7a9a7a] text-xs font-mono uppercase tracking-[0.18em] leading-relaxed">
        {activeItem ? `${activeItem.author} · ${activeItem.classLabel}` : 'Turma 2006'}
      </p>
    </div>
  );
}

function getProfessorPollInitialState() {
  const fallback = { votes: { ...HOME_PROFESSOR_POLL_BASE_VOTES } };
  try {
    const raw = window.localStorage.getItem(HOME_PROFESSOR_POLL_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as { selected?: string; votes?: Record<string, number> };
    return { selected: parsed.selected, votes: { ...HOME_PROFESSOR_POLL_BASE_VOTES, ...(parsed.votes ?? {}) } };
  } catch {
    return fallback;
  }
}

function getProfessorPollPercentages(votes: Record<string, number>) {
  const total = Object.values(votes).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) || 1;
  return Object.fromEntries(
    Object.entries(votes).map(([name, value]) => [name, Math.round((Math.max(0, Number(value) || 0) / total) * 100)])
  );
}

function HomeProfessorPollContent() {
  const [state, setState] = useState(getProfessorPollInitialState);
  const votes = { ...HOME_PROFESSOR_POLL_BASE_VOTES, ...(state.votes ?? {}) };
  const percentages = getProfessorPollPercentages(votes);
  const hasSelected = Boolean(state.selected);

  function selectOption(option: string) {
    if (state.selected) return;
    const nextVotes = { ...votes, [option]: (votes[option] ?? 0) + 1 };
    const nextState = { selected: option, votes: nextVotes };
    setState(nextState);
    try {
      window.localStorage.setItem(HOME_PROFESSOR_POLL_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignora falhas de localStorage em modo privado/restrito.
    }
  }

  return (
    <div className="min-h-[116px] flex flex-col justify-between gap-4">
      <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold mb-1 leading-tight">Qual professor te marcou?</p>
      <div className="grid grid-cols-1 gap-2">
        {Object.keys(HOME_PROFESSOR_POLL_BASE_VOTES).map(option => (
          <span
            key={option}
            role="button"
            tabIndex={0}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();
              selectOption(option);
            }}
            onKeyDown={event => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              selectOption(option);
            }}
            className={
              "inline-flex items-center justify-center min-h-[42px] px-4 py-2 border border-[#2d6a4f]/40 text-[#f0ebe0] hover:border-[#c9a84c]/60 hover:bg-[#1a2e1a] transition-colors text-[11px] font-mono uppercase tracking-[0.14em] text-center " +
              (state.selected === option ? 'border-[#c9a84c]/70 text-[#c9a84c]' : '')
            }
            aria-label={hasSelected ? `${option}: ${percentages[option] ?? 0}% dos votos` : option}
          >
            {hasSelected ? `${percentages[option] ?? 0}%` : option}
          </span>
        ))}
      </div>
    </div>
  );
}

function HomeClassDistributionContent({ people }: { people: DbPerson[] }) {
  const classGroups = ['A', 'B', 'C', 'D'];
  const people2006 = people.filter(person => person.class_year === 2006 && person.class_group && classGroups.includes(person.class_group));
  const counts = classGroups.map(group => ({ group, value: people2006.filter(person => person.class_group === group).length }));

  return (
    <div className="min-h-[116px] flex flex-col justify-between gap-5">
      <div>
        <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">Formados em 2006</p>
        <p className="font-['Playfair_Display'] text-[#f0ebe0] text-5xl font-black leading-none">{people2006.length}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {counts.map(item => (
          <div key={item.group} className="border border-[#2d6a4f]/25 bg-[#0d1a0f] px-4 py-3">
            <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.18em] mb-1">Turma {item.group}</p>
            <p className="font-['Playfair_Display'] text-[#f0ebe0] text-3xl font-bold leading-none">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeProfileStatsContent() {
  const stats = [
    { icon: <GraduationCap size={16} />, value: '5%', label: 'trabalham na área do Direito' },
    { icon: <Baby size={16} />, value: '40%', label: 'tem filhos' },
    { icon: <Venus size={16} />, value: '55%', label: 'são mulheres' },
  ];

  return (
    <div className="min-h-[116px] grid grid-cols-1 gap-2">
      {stats.map(stat => (
        <div key={stat.label} className="flex items-center gap-3 border border-[#2d6a4f]/25 bg-[#0d1a0f] px-4 py-3">
          <div className="w-9 h-9 rounded-full border border-[#2d6a4f]/40 text-[#c9a84c] flex items-center justify-center shrink-0">{stat.icon}</div>
          <div className="min-w-0">
            <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-none">{stat.value}</p>
            <p className="text-[#7a9a7a] text-xs leading-tight mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeMapStatsContent() {
  return (
    <div className="min-h-[116px] flex flex-col justify-between gap-3">
      {HOME_MAP_STATS.map(stat => (
        <div key={stat.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <p className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-none">{stat.value}%</p>
            <p className="text-[#7a9a7a] text-[11px] font-mono uppercase tracking-[0.14em] text-right">{stat.label}</p>
          </div>
          <div className="h-1.5 bg-[#0d1a0f] border border-[#2d6a4f]/20 overflow-hidden">
            <div className="h-full bg-[#c9a84c]/80" style={{ width: `${stat.value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function getPersonDisplayName(person: DbPerson) {
  const name = person.display_name?.trim() || person.full_name?.trim() || 'Ex-aluno(a)';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function getPersonInitials(person: DbPerson) {
  const name = getPersonDisplayName(person);
  const parts = name.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? 'E'}${parts[parts.length - 1]?.[0] ?? 'A'}`.toUpperCase();
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getRotatingSample<T>(items: T[], count: number, seed: number) {
  if (items.length <= count) return items;
  return items
    .map((item, index) => ({ item, rank: seededRandom(seed + index * 17) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map(entry => entry.item);
}

async function getAttendanceIntentPersonIds() {
  try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('person_id,intends_to_attend')
      .eq('intends_to_attend', true);
    if (error) return new Set<string>();
    return new Set(((data ?? []) as { person_id?: string | null }[]).map(row => row.person_id).filter((id): id is string => Boolean(id)));
  } catch {
    return new Set<string>();
  }
}

function AlumniAvatar({ person, size = 'sm' }: { person: DbPerson; size?: 'xs' | 'sm' | 'lg' }) {
  const dimensionClass = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'xs' ? 'w-9 h-9 text-[10px]' : 'w-11 h-11 text-xs';
  return person.avatar_url ? (
    <img src={person.avatar_url} alt={getPersonDisplayName(person)} className={`${dimensionClass} rounded-full object-cover border border-[#2d6a4f]/40 bg-[#0d1a0f]`} />
  ) : (
    <div className={`${dimensionClass} rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] text-[#c9a84c] flex items-center justify-center font-mono font-bold`}>
      {getPersonInitials(person)}
    </div>
  );
}

function HomeClassTabsContent({ alumni }: { alumni: DbPerson[] }) {
  const [activeGroup, setActiveGroup] = useState('A');
  const [page, setPage] = useState(0);
  const classPeople = useMemo(() => (
    alumni
      .filter(person => person.class_group === activeGroup)
      .sort((a, b) => getPersonDisplayName(a).localeCompare(getPersonDisplayName(b), 'pt-BR'))
  ), [alumni, activeGroup]);
  const totalPages = Math.max(1, Math.ceil(classPeople.length / 3));
  const visiblePeople = classPeople.slice(page * 3, page * 3 + 3);

  useEffect(() => {
    setPage(0);
  }, [activeGroup]);

  function changePage(direction: number) {
    setPage(current => (current + direction + totalPages) % totalPages);
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {HOME_ALUMNI_CLASS_GROUPS.map(group => {
          const count = alumni.filter(person => person.class_group === group).length;
          const active = group === activeGroup;
          return (
            <button
              key={group}
              type="button"
              onClick={() => setActiveGroup(group)}
              className={
                "px-3 py-2 border text-[10px] font-mono uppercase tracking-[0.18em] transition-colors " +
                (active ? 'border-[#c9a84c]/80 text-[#c9a84c] bg-[#0d1a0f]' : 'border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#c9a84c]/50 hover:text-[#c9a84c]')
              }
            >
              Turma {group} · {count}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => changePage(-1)}
          className="w-10 h-24 border border-[#2d6a4f]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 transition-colors shrink-0"
          aria-label="Ver pessoas anteriores"
        >
          ‹
        </button>

        <div className="grid grid-cols-1 gap-2 flex-1 min-w-0">
          {visiblePeople.length > 0 ? visiblePeople.map(person => (
            <div key={person.id} className="flex items-center gap-3 border border-[#2d6a4f]/25 bg-[#0d1a0f] px-3 py-2 min-h-[50px]">
              <AlumniAvatar person={person} size="xs" />
              <p className="text-[#f0ebe0] text-sm font-semibold leading-tight truncate">{getPersonDisplayName(person)}</p>
            </div>
          )) : (
            <div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] px-4 py-5 text-[#7a9a7a] text-sm leading-relaxed">
              Nenhum nome encontrado nesta turma.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => changePage(1)}
          className="w-10 h-24 border border-[#2d6a4f]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 transition-colors shrink-0"
          aria-label="Ver próximas pessoas"
        >
          ›
        </button>
      </div>

      <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-[0.16em] mt-3 text-center">
        {classPeople.length ? `Mostrando ${page * 3 + 1}-${Math.min(page * 3 + 3, classPeople.length)} de ${classPeople.length}` : 'Turma sem registros'}
      </p>
    </>
  );
}

function HomeConfirmedPresenceGrid({ confirmed }: { confirmed: DbPerson[] }) {
  const confirmedPreview = confirmed.slice(0, 30);

  return confirmedPreview.length > 0 ? (
    <div className="grid grid-cols-6 sm:grid-cols-10 gap-3 mt-auto">
      {confirmedPreview.map(person => (
        <div key={person.id} className="flex justify-center" title={getPersonDisplayName(person)}>
          <AlumniAvatar person={person} size="xs" />
        </div>
      ))}
    </div>
  ) : (
    <p className="text-[#7a9a7a] text-sm leading-relaxed mt-auto">As fotos de quem confirmou presença aparecerão aqui.</p>
  );
}

function HomeAlumniOverviewPanel({ people, attendanceIntentPersonIds }: { people: DbPerson[]; attendanceIntentPersonIds: Set<string> }) {
  const [seed, setSeed] = useState(1);
  const alumni = useMemo(() => people.filter(person => person.class_year === 2006), [people]);
  const confirmed = alumni.filter(person => person.profile_status === 'confirmed');
  const intending = alumni.filter(person => attendanceIntentPersonIds.has(person.id));
  const samplePeople = useMemo(() => getRotatingSample(alumni, 12, seed), [alumni, seed]);
  const confirmedPercent = alumni.length ? Math.round((confirmed.length / alumni.length) * 100) : 0;

  useEffect(() => {
    if (alumni.length <= 1) return;
    const id = window.setInterval(() => setSeed(value => value + 1), 3000);
    return () => window.clearInterval(id);
  }, [alumni.length]);

  return (
    <div>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <SectionLabelText>Ex-alunos</SectionLabelText>
          <h2 className="font-['Playfair_Display'] text-[#f0ebe0] text-4xl md:text-5xl font-black leading-tight mt-6">A turma em movimento</h2>
        </div>
        <p className="text-[#7a9a7a] text-sm md:text-right max-w-md leading-relaxed">
          Uma prévia compacta da página de ex-alunos, com amostras rotativas, presença no reencontro e distribuição por turma.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">Amostra da turma</p>
              <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">{alumni.length} ex-alunos cadastrados</p>
            </div>
            <Users size={22} className="text-[#c9a84c] shrink-0" />
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-auto">
            {samplePeople.map(person => (
              <div key={person.id} className="flex flex-col items-center text-center gap-2">
                <AlumniAvatar person={person} />
                <p className="text-[#7a9a7a] text-[10px] leading-tight line-clamp-2">{getPersonDisplayName(person)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">Presença</p>
              <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">Reencontro em formação</p>
            </div>
            <UserCheck size={22} className="text-[#c9a84c] shrink-0" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4">
              <p className="font-['Playfair_Display'] text-[#f0ebe0] text-4xl font-black leading-none">{confirmed.length}</p>
              <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-[0.18em] mt-2">Confirmados</p>
            </div>
            <div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4">
              <p className="font-['Playfair_Display'] text-[#f0ebe0] text-4xl font-black leading-none">{intending.length}</p>
              <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-[0.18em] mt-2">Pretendem ir</p>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#7a9a7a] text-xs">Confirmados sobre a base cadastrada</p>
              <p className="text-[#c9a84c] font-mono text-xs">{confirmedPercent}%</p>
            </div>
            <div className="h-2 bg-[#0d1a0f] border border-[#2d6a4f]/25 overflow-hidden">
              <div className="h-full bg-[#c9a84c]/80" style={{ width: `${confirmedPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">Turmas</p>
              <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">Distribuição por sala</p>
            </div>
            <GraduationCap size={22} className="text-[#c9a84c] shrink-0" />
          </div>
          <HomeClassTabsContent alumni={alumni} />
        </div>

        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">Confirmados</p>
              <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">Quem confirmou presença</p>
            </div>
            <UserCheck size={22} className="text-[#c9a84c] shrink-0" />
          </div>
          <HomeConfirmedPresenceGrid confirmed={confirmed} />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 text-center">
        <p className="text-[#7a9a7a] text-sm font-mono">Amostras rotativas com pessoas cadastradas na tabela da turma.</p>
        <a href="/ex-alunos" className="inline-flex items-center gap-2 text-[#8ab89a] hover:text-[#c9a84c] transition-colors font-mono text-sm uppercase tracking-[0.22em]">
          Ver todos <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

function SectionLabelText({ children }: { children: React.ReactNode }) {
  return <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-[0.4em]">{children}</p>;
}

function findConfirmedPreviewSection() {
  const label = Array.from(document.querySelectorAll('p'))
    .find(node => node.textContent?.trim().toLowerCase() === 'confirmados');
  const section = label?.closest('section');
  return section instanceof HTMLElement ? section : null;
}

function replaceConfirmedPreviewWithAlumniPanel(people: DbPerson[], attendanceIntentPersonIds: Set<string>) {
  const section = findConfirmedPreviewSection();
  if (!section) return false;
  if (section.querySelector('[data-home-alumni-overview-panel="true"]')) return true;

  const container = section.querySelector<HTMLElement>('.max-w-7xl') ?? section;
  const mount = document.createElement('div');
  mount.dataset.homeAlumniOverviewPanel = 'true';
  container.replaceChildren(mount);
  createRoot(mount).render(<HomeAlumniOverviewPanel people={people} attendanceIntentPersonIds={attendanceIntentPersonIds} />);
  return true;
}

async function installHomePreviewEnhancements() {
  if (!isHomePath()) return;

  let people: DbPerson[] = [];
  let memories: DbMemory[] = [];
  let attendanceIntentPersonIds = new Set<string>();
  try {
    [people, memories, attendanceIntentPersonIds] = await Promise.all([
      getPeople(),
      getApprovedMemories(DEFAULT_EVENT_ID),
      getAttendanceIntentPersonIds(),
    ]);
  } catch {
    people = [];
    memories = [];
    attendanceIntentPersonIds = new Set<string>();
  }

  let attempts = 0;
  const apply = () => {
    attempts += 1;
    if (!isHomePath()) return true;

    const timelineCard = findPreviewCardByLabel('linha do tempo');
    const memoryCard = findPreviewCardByLabel('memórias');
    const pollCard = findPreviewCardByLabel('enquetes');
    const profileCard = findPreviewCardByLabel('perfil');
    const mapCard = findPreviewCardByLabel('mapa da turma');

    const homeCardsReady = Boolean(timelineCard && memoryCard && pollCard && profileCard && mapCard);
    const confirmedReady = Boolean(findConfirmedPreviewSection());
    if ((!homeCardsReady || !confirmedReady) && attempts <= 20) return false;

    if (timelineCard && memoryCard && pollCard && profileCard && mapCard) {
      removePreviewCard('gráficos');
      mountAfterLabel(timelineCard, 'linha do tempo', <HomeClassDistributionContent people={people} />, { removeLabel: true });
      mountAfterLabel(memoryCard, 'memórias', <HomeMemoryPreviewContent memories={memories} people={people} />);
      mountAfterLabel(pollCard, 'enquetes', <HomeProfessorPollContent />);
      mountAfterLabel(profileCard, 'perfil', <HomeProfileStatsContent />);
      mountAfterLabel(mapCard, 'mapa da turma', <HomeMapStatsContent />);
      replaceLeftStatsWithTimeline();
    }

    replaceConfirmedPreviewWithAlumniPanel(people, attendanceIntentPersonIds);
    return true;
  };

  if (apply()) return;
  const retryId = window.setInterval(() => {
    if (apply()) window.clearInterval(retryId);
  }, 150);
}

async function bootstrap() {
  await preloadHomeContent();

  createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  installHeroScrollBehavior();
  window.requestAnimationFrame(() => {
    void installHomePreviewEnhancements();
  });
}

void bootstrap();