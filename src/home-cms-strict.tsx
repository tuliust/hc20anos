import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Baby,
  BookImage,
  GraduationCap,
  Laptop,
  MessagesSquare,
  PhoneCall,
  Proportions,
  Smartphone,
  UserCheck,
  Users,
  Venus,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { getHomePageContent, getPeople, getPollResults, getPolls, votePoll } from './lib/services';
import type { DbPerson } from './lib/database.types';

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001';
const HOME_PATHS = new Set(['', '/', '/index.html']);
const CLASS_GROUPS = ['A', 'B', 'C', 'D'];

type CmsContent = Record<string, any>;
type ProfileRow = {
  person_id?: string | null;
  current_city?: string | null;
  current_state?: string | null;
  current_country?: string | null;
  profession?: string | null;
  has_children?: boolean | null;
  intends_to_attend?: boolean | null;
};

type StatItem = {
  key: string;
  icon?: string;
  label: string;
  mode?: 'auto' | 'fixed';
  value?: string | number | null;
  fallback_value?: string | number | null;
};

type MapItem = {
  key: string;
  label: string;
  mode?: 'auto' | 'fixed';
  value?: number | null;
  fallback_value?: number | null;
};

type TimelineItem = {
  year: string;
  icon?: string;
  title: string;
  description?: string | null;
};

type AlumniCopy = Partial<Record<
  | 'eyebrow'
  | 'title'
  | 'description'
  | 'sample_label'
  | 'sample_title_template'
  | 'presence_label'
  | 'presence_title'
  | 'confirmed_label'
  | 'intending_label'
  | 'progress_label'
  | 'classes_label'
  | 'classes_title'
  | 'confirmed_grid_label'
  | 'confirmed_grid_title'
  | 'footer_note'
  | 'view_all_label'
  | 'class_tab_label_template'
  | 'class_pagination_template'
  | 'class_empty_label'
  | 'confirmed_empty_label',
  string
>>;

type PollFallback = Partial<Record<
  'question' | 'empty_label' | 'login_required_label' | 'success_label' | 'error_label',
  string
>> & { options?: string[] };

function currentPathname() {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function isHomePath() {
  return HOME_PATHS.has(currentPathname());
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value) || (value && typeof value === 'object')) return value as T;
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function applyTemplate(template: string | undefined, values: Record<string, string | number>) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

function getPersonDisplayName(person: DbPerson) {
  const name = (person as any).display_name?.trim() || person.full_name?.trim() || '';
  if (!name) return '';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function getPersonInitials(person: DbPerson) {
  const displayName = getPersonDisplayName(person);
  const parts = displayName.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase() || '—';
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

function roundPercent(count: number, total: number, fallback: string | number | null | undefined) {
  if (!total) return fallback !== undefined && fallback !== null && fallback !== '' ? String(fallback) : '0%';
  return `${Math.round((count / total) * 100)}%`;
}

async function fetchProfileRows(): Promise<ProfileRow[]> {
  try {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('person_id,current_city,current_state,current_country,profession,has_children,intends_to_attend');
    if (error) return [];
    return (data ?? []) as ProfileRow[];
  } catch {
    return [];
  }
}

function iconForStat(icon?: string) {
  if (icon === 'baby') return <Baby size={16} />;
  if (icon === 'venus') return <Venus size={16} />;
  return <GraduationCap size={16} />;
}

function iconForTimeline(icon?: string) {
  if (icon === 'laptop') return Laptop;
  if (icon === 'messages-square') return MessagesSquare;
  if (icon === 'proportions') return Proportions;
  if (icon === 'smartphone') return Smartphone;
  if (icon === 'book-image') return BookImage;
  return PhoneCall;
}

function CmsPlaceholder({ message = 'Conteúdo não configurado no Admin.' }: { message?: string }) {
  return (
    <div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] px-4 py-5 text-[#7a9a7a] text-sm leading-relaxed">
      {message}
    </div>
  );
}

function AlumniAvatar({ person, size = 'sm' }: { person: DbPerson; size?: 'xs' | 'sm' | 'lg' }) {
  const dimensionClass = size === 'lg' ? 'w-24 h-24 text-2xl' : size === 'xs' ? 'w-9 h-9 text-[10px]' : 'w-11 h-11 text-xs';
  const displayName = getPersonDisplayName(person);
  return (person as any).avatar_url ? (
    <img src={(person as any).avatar_url} alt={displayName} className={`${dimensionClass} rounded-full object-cover border border-[#2d6a4f]/40 bg-[#0d1a0f]`} />
  ) : (
    <div className={`${dimensionClass} rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] text-[#c9a84c] flex items-center justify-center font-mono font-bold`}>
      {getPersonInitials(person)}
    </div>
  );
}

function computeProfileStats(items: StatItem[], people: DbPerson[], profiles: ProfileRow[]) {
  const lawTerms = ['direito', 'advogado', 'advogada', 'juridico', 'jurídico', 'juridica', 'jurídica'];
  const profilesWithProfession = profiles.filter(row => row.profession?.trim());
  const lawCount = profilesWithProfession.filter(row => lawTerms.some(term => normalizeText(row.profession).includes(normalizeText(term)))).length;
  const childrenRows = profiles.filter(row => typeof row.has_children === 'boolean');
  const childrenCount = childrenRows.filter(row => row.has_children === true).length;
  const genderRows = people.filter(person => ['male', 'female'].includes(String((person as any).gender ?? '')));
  const womenCount = genderRows.filter(person => (person as any).gender === 'female').length;

  return items.map(item => {
    if (item.mode === 'fixed' && item.value !== undefined && item.value !== null) return { ...item, displayValue: String(item.value) };
    if (item.key === 'law') return { ...item, displayValue: roundPercent(lawCount, profilesWithProfession.length, item.fallback_value) };
    if (item.key === 'children') return { ...item, displayValue: roundPercent(childrenCount, childrenRows.length, item.fallback_value) };
    if (item.key === 'women') return { ...item, displayValue: roundPercent(womenCount, genderRows.length, item.fallback_value) };
    return { ...item, displayValue: String(item.fallback_value ?? item.value ?? '0%') };
  });
}

function computeMapStats(items: MapItem[], profiles: ProfileRow[]) {
  const counts = { natal: 0, interior: 0, other_state: 0, foreign: 0 } as Record<string, number>;
  for (const row of profiles) {
    const city = normalizeText(row.current_city);
    const state = normalizeText(row.current_state);
    const country = normalizeText(row.current_country || 'Brasil');
    if (!city && !state && !country) continue;
    if (country && country !== 'brasil' && country !== 'brazil') counts.foreign += 1;
    else if (city.includes('natal')) counts.natal += 1;
    else if (state && state !== 'rn' && state !== 'rio grande do norte') counts.other_state += 1;
    else counts.interior += 1;
  }
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return items.map(item => {
    const fallback = Number(item.fallback_value ?? item.value ?? 0);
    const value = item.mode === 'fixed' && item.value !== undefined && item.value !== null
      ? Number(item.value)
      : total ? Math.round(((counts[item.key] ?? 0) / total) * 100) : fallback;
    return { ...item, displayValue: Number.isFinite(value) ? value : 0 };
  });
}

function HomeProfileStatsContent({ content, people, profiles }: { content: CmsContent; people: DbPerson[]; profiles: ProfileRow[] }) {
  const items = parseJson<StatItem[]>(content.home_profile_stats_json, []).filter(item => item.key && item.label);
  if (!items.length) return <CmsPlaceholder />;
  const stats = computeProfileStats(items, people, profiles);
  return (
    <div className="min-h-[116px] grid grid-cols-1 gap-2">
      {stats.map(stat => (
        <div key={stat.key || stat.label} className="flex items-center gap-3 border border-[#2d6a4f]/25 bg-[#0d1a0f] px-4 py-3">
          <div className="w-9 h-9 rounded-full border border-[#2d6a4f]/40 text-[#c9a84c] flex items-center justify-center shrink-0">{iconForStat(stat.icon)}</div>
          <div className="min-w-0">
            <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-none">{(stat as any).displayValue}</p>
            <p className="text-[#7a9a7a] text-xs leading-tight mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeMapStatsContent({ content, profiles }: { content: CmsContent; profiles: ProfileRow[] }) {
  const items = parseJson<MapItem[]>(content.home_map_stats_json, []).filter(item => item.key && item.label);
  if (!items.length) return <CmsPlaceholder />;
  const stats = computeMapStats(items, profiles);
  return (
    <div className="min-h-[116px] flex flex-col justify-between gap-3">
      {stats.map(stat => (
        <div key={stat.key || stat.label}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <p className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-none">{(stat as any).displayValue}%</p>
            <p className="text-[#7a9a7a] text-[11px] font-mono uppercase tracking-[0.14em] text-right">{stat.label}</p>
          </div>
          <div className="h-1.5 bg-[#0d1a0f] border border-[#2d6a4f]/20 overflow-hidden">
            <div className="h-full bg-[#c9a84c]/80" style={{ width: `${Math.max(0, Math.min(100, Number((stat as any).displayValue) || 0))}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HomeNostalgiaTimeline({ content }: { content: CmsContent }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const items = parseJson<TimelineItem[]>(content.home_nostalgia_timeline_json, []).filter(item => item.year && item.title);
  if (!items.length) return null;
  return (
    <div className="mt-8">
      <div className="relative">
        <div className="absolute left-9 top-0 bottom-0 w-px bg-[#2d6a4f]/35" />
        <div className="flex flex-col gap-4">
          {items.map((item, index) => {
            const Icon = iconForTimeline(item.icon);
            const active = index === activeIndex;
            return (
              <button key={`${item.year}-${index}`} type="button" onClick={() => setActiveIndex(index)} className="relative grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 text-left group">
                <div className="relative flex justify-center">
                  <div className={(active ? 'w-16 h-16 text-base shadow-[0_0_0_10px_rgba(201,168,76,0.08)] border-[#c9a84c]/80' : 'w-12 h-12 text-xs border-[#2d6a4f]/50') + " z-10 rounded-full bg-[#0d1a0f] text-[#c9a84c] border flex items-center justify-center font-mono font-bold transition-all duration-300"}>
                    {item.year}
                  </div>
                </div>
                <div className="pb-4 pt-1">
                  <Icon className={(active ? 'h-7 w-7' : 'h-5 w-5') + " text-[#c9a84c] mb-2 transition-all duration-300"} strokeWidth={1.7} />
                  <p className={(active ? 'text-2xl md:text-3xl' : 'text-xl') + " font-['Playfair_Display'] text-[#f0ebe0] font-bold leading-tight transition-all duration-300"}>{item.title}</p>
                  {active && item.description && <p className="text-[#7a9a7a] text-sm md:text-base leading-relaxed mt-3">{item.description}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HomeClassTabsContent({ alumni, copy }: { alumni: DbPerson[]; copy: AlumniCopy }) {
  const [activeGroup, setActiveGroup] = useState('A');
  const [page, setPage] = useState(0);
  const classPeople = useMemo(() => alumni.filter(person => (person as any).class_group === activeGroup).sort((a, b) => getPersonDisplayName(a).localeCompare(getPersonDisplayName(b), 'pt-BR')), [alumni, activeGroup]);
  const totalPages = Math.max(1, Math.ceil(classPeople.length / 3));
  const visiblePeople = classPeople.slice(page * 3, page * 3 + 3);

  useEffect(() => setPage(0), [activeGroup]);

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-5">
        {CLASS_GROUPS.map(group => {
          const active = group === activeGroup;
          return (
            <button key={group} type="button" onClick={() => setActiveGroup(group)} className={(active ? 'border-[#c9a84c]/80 text-[#c9a84c] bg-[#0d1a0f]' : 'border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#c9a84c]/50 hover:text-[#c9a84c]') + " px-3 py-2 border text-[10px] font-mono uppercase tracking-[0.18em] transition-colors"}>
              {applyTemplate(copy.class_tab_label_template, { group }) || group}
            </button>
          );
        })}
      </div>
      <div className="mt-auto grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
        <button type="button" onClick={() => setPage(current => (current - 1 + totalPages) % totalPages)} className="h-24 border border-[#2d6a4f]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 transition-colors" aria-label="Anterior">‹</button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 min-w-0">
          {visiblePeople.length > 0 ? visiblePeople.map(person => (
            <div key={person.id} className="flex items-center gap-3 border border-[#2d6a4f]/25 bg-[#0d1a0f] px-3 py-3 min-h-[64px]">
              <AlumniAvatar person={person} size="xs" />
              <p className="text-[#f0ebe0] text-sm font-semibold leading-tight truncate">{getPersonDisplayName(person)}</p>
            </div>
          )) : (
            <div className="md:col-span-3 border border-[#2d6a4f]/25 bg-[#0d1a0f] px-4 py-5 text-[#7a9a7a] text-sm leading-relaxed">{copy.class_empty_label}</div>
          )}
        </div>
        <button type="button" onClick={() => setPage(current => (current + 1) % totalPages)} className="h-24 border border-[#2d6a4f]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 transition-colors" aria-label="Próximo">›</button>
      </div>
      <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-[0.16em] mt-3 text-center">
        {classPeople.length ? applyTemplate(copy.class_pagination_template, { start: page * 3 + 1, end: Math.min(page * 3 + 3, classPeople.length), total: classPeople.length }) : copy.class_empty_label}
      </p>
    </>
  );
}

function HomeConfirmedPresenceGrid({ confirmed, copy }: { confirmed: DbPerson[]; copy: AlumniCopy }) {
  const preview = confirmed.slice(0, 30);
  if (!preview.length) return <p className="text-[#7a9a7a] text-sm leading-relaxed mt-auto">{copy.confirmed_empty_label}</p>;
  if (preview.length === 1) {
    return <div className="mt-auto flex min-h-[9.5rem] items-center justify-center"><AlumniAvatar person={preview[0]} size="lg" /></div>;
  }
  return (
    <div className="grid grid-cols-6 sm:grid-cols-10 gap-3 mt-auto">
      {preview.map(person => <div key={person.id} className="flex justify-center" title={getPersonDisplayName(person)}><AlumniAvatar person={person} size="xs" /></div>)}
    </div>
  );
}

function SectionLabelText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-[0.4em]">{children}</p>;
}

function HomeAlumniOverviewPanel({ content, people, profiles }: { content: CmsContent; people: DbPerson[]; profiles: ProfileRow[] }) {
  const [seed, setSeed] = useState(1);
  const copy = parseJson<AlumniCopy>(content.home_alumni_overview_json, {});
  if (!copy.title) return null;

  const alumni = useMemo(() => people.filter(person => person.class_year === 2006), [people]);
  const confirmed = alumni.filter(person => person.profile_status === 'confirmed');
  const intendingIds = new Set(profiles.filter(row => row.intends_to_attend).map(row => row.person_id).filter(Boolean));
  const intending = alumni.filter(person => intendingIds.has(person.id));
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
          <SectionLabelText>{copy.eyebrow}</SectionLabelText>
          <h2 className="font-['Playfair_Display'] text-[#f0ebe0] text-4xl md:text-5xl font-black leading-tight mt-6">{copy.title}</h2>
        </div>
        {copy.description && <p className="text-[#7a9a7a] text-sm md:text-right max-w-md leading-relaxed">{copy.description}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">{copy.sample_label}</p><p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">{applyTemplate(copy.sample_title_template, { total: alumni.length })}</p></div><Users size={22} className="text-[#c9a84c] shrink-0" /></div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-auto">{samplePeople.map(person => <div key={person.id} className="flex flex-col items-center text-center gap-2"><AlumniAvatar person={person} /><p className="text-[#7a9a7a] text-[10px] leading-tight line-clamp-2">{getPersonDisplayName(person)}</p></div>)}</div>
        </div>
        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">{copy.presence_label}</p><p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">{copy.presence_title}</p></div><UserCheck size={22} className="text-[#c9a84c] shrink-0" /></div>
          <div className="grid grid-cols-2 gap-3 mb-5"><div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4"><p className="font-['Playfair_Display'] text-[#f0ebe0] text-4xl font-black leading-none">{confirmed.length}</p><p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-[0.18em] mt-2">{copy.confirmed_label}</p></div><div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4"><p className="font-['Playfair_Display'] text-[#f0ebe0] text-4xl font-black leading-none">{intending.length}</p><p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-[0.18em] mt-2">{copy.intending_label}</p></div></div>
          <div className="mt-auto"><div className="flex items-center justify-between mb-2"><p className="text-[#7a9a7a] text-xs">{copy.progress_label}</p><p className="text-[#c9a84c] font-mono text-xs">{confirmedPercent}%</p></div><div className="h-2 bg-[#0d1a0f] border border-[#2d6a4f]/25 overflow-hidden"><div className="h-full bg-[#c9a84c]/80" style={{ width: `${confirmedPercent}%` }} /></div></div>
        </div>
        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col"><div className="flex items-start justify-between gap-4 mb-5"><div><p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">{copy.classes_label}</p><p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">{copy.classes_title}</p></div><GraduationCap size={22} className="text-[#c9a84c] shrink-0" /></div><HomeClassTabsContent alumni={alumni} copy={copy} /></div>
        <div className="border border-[#2d6a4f]/25 bg-[#141f14] p-6 min-h-[260px] flex flex-col"><div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-[0.28em] mb-2">{copy.confirmed_grid_label}</p><p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold leading-tight">{copy.confirmed_grid_title}</p></div><UserCheck size={22} className="text-[#c9a84c] shrink-0" /></div><HomeConfirmedPresenceGrid confirmed={confirmed} copy={copy} /></div>
      </div>
      <div className="mt-10 flex flex-col items-center gap-4 text-center"><p className="text-[#7a9a7a] text-sm font-mono">{copy.footer_note}</p>{copy.view_all_label && <a href="/ex-alunos" className="inline-flex items-center gap-2 text-[#8ab89a] hover:text-[#c9a84c] transition-colors font-mono text-sm uppercase tracking-[0.22em]">{copy.view_all_label} <span aria-hidden="true">→</span></a>}</div>
    </div>
  );
}

function HomePollContent({ content, polls, resultsByPoll }: { content: CmsContent; polls: any[]; resultsByPoll: Record<string, Record<string, number>> }) {
  const fallback = parseJson<PollFallback>(content.home_poll_fallback_json, {});
  const selectedPoll = (content.home_poll_id ? polls.find(poll => poll.id === content.home_poll_id) : null) ?? polls.find(poll => poll.status === 'open') ?? polls[0] ?? null;
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<Record<string, number>>(selectedPoll ? (resultsByPoll[selectedPoll.id] ?? {}) : {});
  const fallbackOptions = Array.isArray(fallback.options) ? fallback.options.filter(Boolean) : [];
  const options = selectedPoll?.poll_options ? [...selectedPoll.poll_options].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : fallbackOptions.map((option: string, index: number) => ({ id: `fallback-${index}`, option_text: option }));
  const totalVotes = Object.values(results).reduce((sum, value) => sum + Number(value || 0), 0);
  const hasResults = selectedPoll && totalVotes > 0;

  useEffect(() => {
    setResults(selectedPoll ? (resultsByPoll[selectedPoll.id] ?? {}) : {});
  }, [selectedPoll?.id]);

  async function selectOption(option: any) {
    if (!selectedPoll || selectedPoll.status !== 'open' || !option.id || String(option.id).startsWith('fallback-')) {
      setMessage(fallback.empty_label ?? '');
      return;
    }
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) {
      setMessage(fallback.login_required_label ?? '');
      return;
    }
    try {
      await votePoll({ pollId: selectedPoll.id, optionId: option.id, userId, allowMultiple: Boolean(selectedPoll.allow_multiple_votes) });
      const next = await getPollResults(selectedPoll.id);
      setResults(next);
      setMessage(fallback.success_label ?? '');
    } catch {
      setMessage(fallback.error_label ?? '');
    }
  }

  if (!selectedPoll && !fallback.question && options.length === 0) return <CmsPlaceholder />;

  return (
    <div className="min-h-[116px] flex flex-col justify-between gap-4">
      {(selectedPoll?.question || fallback.question) && <p className="font-['Playfair_Display'] text-[#f0ebe0] text-2xl font-bold mb-1 leading-tight">{selectedPoll?.question ?? fallback.question}</p>}
      <div className="grid grid-cols-1 gap-2">
        {options.slice(0, 4).map((option: any) => {
          const count = Number(results[option.id] ?? 0);
          const percent = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
          return (
            <button key={option.id} type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); void selectOption(option); }} className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 border border-[#2d6a4f]/40 text-[#f0ebe0] hover:border-[#c9a84c]/60 hover:bg-[#1a2e1a] transition-colors text-[11px] font-mono uppercase tracking-[0.14em] text-center">
              {hasResults ? `${percent}%` : option.option_text}
            </button>
          );
        })}
      </div>
      {message && <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-[0.14em]">{message}</p>}
    </div>
  );
}

function findPreviewCardByLabel(label: string) {
  const normalized = label.trim().toLowerCase();
  const cards = Array.from(document.querySelectorAll<HTMLElement>('[role="button"], button'));
  return cards.find(card => Array.from(card.querySelectorAll('p')).some(node => node.textContent?.trim().toLowerCase() === normalized)) ?? null;
}

function findCardLabel(card: HTMLElement, label: string) {
  const normalized = label.trim().toLowerCase();
  return Array.from(card.querySelectorAll('p')).find(node => node.textContent?.trim().toLowerCase() === normalized) ?? null;
}

function mountAfterLabel(card: HTMLElement, labelText: string, element: React.ReactNode) {
  const label = findCardLabel(card, labelText);
  if (!label) return false;
  let next = label.nextElementSibling;
  while (next) {
    const current = next;
    next = next.nextElementSibling;
    current.remove();
  }
  const mount = document.createElement('div');
  mount.dataset.homeCmsStrictMount = labelText;
  label.insertAdjacentElement('afterend', mount);
  createRoot(mount).render(<>{element}</>);
  return true;
}

function replaceTimeline(content: CmsContent) {
  const target = document.querySelector<HTMLElement>('[data-home-nostalgia-timeline="true"]');
  if (!target || target.dataset.homeCmsStrictApplied === 'true') return Boolean(target);
  target.dataset.homeCmsStrictApplied = 'true';
  target.replaceChildren();
  createRoot(target).render(<HomeNostalgiaTimeline content={content} />);
  return true;
}

function replaceAlumniPanel(content: CmsContent, people: DbPerson[], profiles: ProfileRow[]) {
  const target = document.querySelector<HTMLElement>('[data-home-alumni-overview-panel="true"]');
  if (!target || target.dataset.homeCmsStrictApplied === 'true') return Boolean(target);
  target.dataset.homeCmsStrictApplied = 'true';
  target.replaceChildren();
  createRoot(target).render(<HomeAlumniOverviewPanel content={content} people={people} profiles={profiles} />);
  return true;
}

async function installHomeCmsStrict() {
  if (!isHomePath()) return;
  let content: CmsContent = {};
  let people: DbPerson[] = [];
  let profiles: ProfileRow[] = [];
  let polls: any[] = [];
  let resultsByPoll: Record<string, Record<string, number>> = {};
  try {
    [content, people, profiles, polls] = await Promise.all([
      getHomePageContent(DEFAULT_EVENT_ID) as Promise<CmsContent>,
      getPeople(),
      fetchProfileRows(),
      getPolls(DEFAULT_EVENT_ID, false) as Promise<any[]>,
    ]);
    const resultEntries = await Promise.all((polls ?? []).slice(0, 5).map(async poll => [poll.id, await getPollResults(poll.id)] as const));
    resultsByPoll = Object.fromEntries(resultEntries);
  } catch {
    content = {};
    people = [];
    profiles = [];
    polls = [];
    resultsByPoll = {};
  }

  let attempts = 0;
  const apply = () => {
    attempts += 1;
    if (!isHomePath()) return true;
    const pollCard = findPreviewCardByLabel('enquetes');
    const profileCard = findPreviewCardByLabel('perfil');
    const mapCard = findPreviewCardByLabel('mapa da turma');
    if (pollCard) mountAfterLabel(pollCard, 'enquetes', <HomePollContent content={content} polls={polls} resultsByPoll={resultsByPoll} />);
    if (profileCard) mountAfterLabel(profileCard, 'perfil', <HomeProfileStatsContent content={content} people={people} profiles={profiles} />);
    if (mapCard) mountAfterLabel(mapCard, 'mapa da turma', <HomeMapStatsContent content={content} profiles={profiles} />);
    replaceTimeline(content);
    replaceAlumniPanel(content, people, profiles);
    const ready = Boolean(pollCard && profileCard && mapCard && document.querySelector('[data-home-nostalgia-timeline="true"]') && document.querySelector('[data-home-alumni-overview-panel="true"]'));
    return ready || attempts > 30;
  };

  if (apply()) return;
  const retry = window.setInterval(() => {
    if (apply()) window.clearInterval(retry);
  }, 200);
}

void installHomeCmsStrict();
