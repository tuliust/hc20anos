import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Baby, BarChart3, ChevronRight, FileText, MapPin, Search, UserCheck, Users } from "lucide-react";
import {
  getCuriosityProfileStats,
  getMyPollVotes,
  getPollResults,
  getPolls,
  getPublicCuriosityProfileDetails,
  getPublicLocationStats,
  getSchoolQuestionnaireOptionStats,
  getSchoolQuestionnaireResponseStats,
  votePoll,
} from "../../lib/services";
import type {
  CuriosityProfileStatsRow,
  DbPerson,
  LocationStat,
  PublicCuriosityProfileDetailRow,
  SchoolQuestionnaireOptionStatRow,
  SchoolQuestionnaireResponseStatsRow,
} from "../../lib/people.types";
import type { DbPoll, DbPollOption, DbPollVote } from "../../lib/engagement.types";
import { DEFAULT_EVENT_ID } from "../app.constants";
import type { AuthState, Page } from "../app.types";
import { Btn, DisplayTitle, EmptyState, ErrorState, LoadingState, SectionLabel, StatusBadge } from "../components/AppPrimitives";

type HomeMapConfig = {
  key: "natal" | "interior" | "other_state" | "foreign";
  label?: string;
  mode?: "auto" | "fixed";
  value?: number;
  fallback_value?: number;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
};

type PersonDetailModalProps = {
  person: DbPerson | null;
  onClose: () => void;
  onClaim?: () => void;
};

type CuriositiesPageProps = {
  navigate: (page: Page) => void;
  auth: AuthState;
  people: DbPerson[];
  ModalComponent: ComponentType<ModalProps>;
  PersonDetailModalComponent: ComponentType<PersonDetailModalProps>;
  HomeMapChartComponent: ComponentType<{ configs: HomeMapConfig[]; locations: LocationStat[] }>;
  schoolProfileQuestions: Array<{ id: string; title: string }>;
  getInitials: (name: string) => string;
  normalizeValue: (value?: string | number | null) => string;
};

function StatCard({ label, value, hint, icon, onClick, drilldown }: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  onClick?: () => void;
  drilldown?: string;
}) {
  const content = (
    <>
      <div>
        <p className="text-[#c9a84c] font-mono text-3xl font-bold leading-none">{value}</p>
        <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider mt-2">{label}</p>
        {hint && <p className="text-[#3a5a3a] text-xs mt-2 leading-relaxed">{hint}</p>}
      </div>
      {icon && <div className="text-[#2d6a4f] shrink-0">{icon}</div>}
    </>
  );

  if (!onClick) {
    return <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-5 flex items-start justify-between gap-4">{content}</div>;
  }

  return (
    <button
      type="button"
      data-curiosities-drilldown={drilldown}
      onClick={onClick}
      className="bg-[#141f14] border border-[#2d6a4f]/30 p-5 flex items-start justify-between gap-4 text-left hover:border-[#c9a84c]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] transition-colors"
    >
      {content}
    </button>
  );
}

function MiniBarChart({ title, description, rows, emptyLabel = "Dados ainda insuficientes." }: {
  title: string;
  description?: string;
  rows: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  const cleanRows = rows.filter(row => row.count > 0).slice(0, 8);
  const max = Math.max(...cleanRows.map(row => row.count), 1);
  return (
    <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
      <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Infográfico</p>
      <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-tight">{title}</h3>
      {description && <p className="text-[#7a9a7a] text-sm mt-2 mb-5 leading-relaxed">{description}</p>}
      {!cleanRows.length ? (
        <p className="text-[#7a9a7a] text-sm mt-5">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-4 mt-5">
          {cleanRows.map(row => {
            const width = Math.max(8, Math.round((row.count / max) * 100));
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-[#f0ebe0] text-sm font-semibold">{row.label}</span>
                  <span className="text-[#c9a84c] font-mono text-xs">{row.count}</span>
                </div>
                <div className="h-2.5 bg-[#0d1a0f] border border-[#2d6a4f]/20 overflow-hidden">
                  <div className="h-full bg-[#2d6a4f]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getQuestionTitle(questionId: string) {
  return schoolProfileQuestions.find(question => question.id === questionId)?.title ?? questionId;
}

function groupQuestionnaireStats(rows: SchoolQuestionnaireOptionStatRow[]) {
  const grouped = new Map<string, { label: string; count: number }[]>();
  for (const row of rows) {
    const current = grouped.get(row.question_id) ?? [];
    current.push({ label: row.option_label, count: row.answer_count });
    grouped.set(row.question_id, current);
  }
  return schoolProfileQuestions.map(question => ({
    id: question.id,
    title: question.title,
    rows: (grouped.get(question.id) ?? []).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR")),
  }));
}

type CuriosityDrilldownKind = "alumni" | "cities" | "professions" | "children";

function CuriosityDrilldownModal({
  kind,
  details,
  locations,
  professionRows,
  childrenTotal,
  people,
  onClose,
  onOpenPerson,
}: {
  kind: CuriosityDrilldownKind | null;
  details: PublicCuriosityProfileDetailRow[];
  locations: LocationStat[];
  professionRows: { label: string; count: number }[];
  childrenTotal: number;
  people: DbPerson[];
  onClose: () => void;
  onOpenPerson: (person: DbPerson) => void;
}) {
  const [query, setQuery] = useState("");
  const peopleById = useMemo(() => new Map(people.map(person => [person.id, person])), [people]);
  const detailsById = useMemo(() => new Map(details.map(row => [row.person_id, row])), [details]);

  useEffect(() => {
    if (!kind) setQuery("");
  }, [kind]);

  const titles: Record<CuriosityDrilldownKind, string> = {
    alumni: "Ex-alunos 2006",
    cities: "Cidades onde estão hoje",
    professions: "Áreas profissionais",
    children: "Total de filhos dos ex-alunos",
  };

  function renderPerson(row: PublicCuriosityProfileDetailRow, suffix = "") {
    const person = peopleById.get(row.person_id);
    if (!person) return null;
    return (
      <button
        type="button"
        key={`${row.person_id}-${suffix}`}
        data-curiosity-person-id={row.person_id}
        onClick={() => onOpenPerson(person)}
        className="w-full flex items-center gap-3 border border-[#2d6a4f]/25 bg-[#0d1a0f] hover:border-[#c9a84c]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] px-3 py-3 text-left transition-colors"
      >
        <div className="w-10 h-10 shrink-0 bg-[#2d6a4f] overflow-hidden flex items-center justify-center text-[#f0ebe0] font-mono font-bold text-xs">
          {row.avatar_url ? <img src={row.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(row.display_name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[#f0ebe0] text-sm font-semibold truncate">{row.display_name}</p>
          <p className="text-[#7a9a7a] text-[11px] font-mono mt-1">{row.class_group ? `Turma ${row.class_group}` : "Turma não informada"}</p>
        </div>
        <ChevronRight size={15} className="text-[#7a9a7a] shrink-0" />
      </button>
    );
  }

  const normalizedQuery = normalizeValue(query);
  const alumniRows = details.filter(row =>
    !normalizedQuery || normalizeValue(row.display_name).includes(normalizedQuery) || normalizeValue(row.class_group).includes(normalizedQuery)
  );
  const childrenRows = details.filter(row => row.has_children === true);

  return (
    <ModalComponent open={Boolean(kind)} onClose={onClose} title={kind ? titles[kind] : "Curiosidades"} wide>
      <div data-curiosities-drilldown-modal={kind ?? undefined} className="flex flex-col gap-4">
        {kind === "alumni" && (
          <>
            <p className="text-[#8ab89a] text-sm">{details.length} ex-aluno{details.length === 1 ? "" : "s"} na base pública viva de 2006.</p>
            {details.length > 20 && (
              <label className="relative block">
                <span className="sr-only">Buscar ex-aluno</span>
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nome ou turma..." className="w-full bg-[#0a120a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-3 pl-10 pr-3 text-sm focus:outline-none focus:border-[#c9a84c]" />
              </label>
            )}
            <div className="max-h-[62svh] overflow-y-auto flex flex-col gap-2 pr-1">{alumniRows.map(row => renderPerson(row, "alumni"))}</div>
          </>
        )}

        {kind === "cities" && (
          <div className="max-h-[68svh] overflow-y-auto flex flex-col gap-4 pr-1">
            {locations.map(location => {
              const rows = location.people.map(person => detailsById.get(person.person_id)).filter(Boolean) as PublicCuriosityProfileDetailRow[];
              return (
                <section key={location.key} className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-[#f0ebe0] font-semibold">{location.city}{location.state ? ` · ${location.state}` : ""}{location.country ? ` · ${location.country}` : ""}</h3>
                      <p className="text-[#7a9a7a] text-xs mt-1">Somente localização autorizada.</p>
                    </div>
                    <span className="text-[#c9a84c] font-mono text-sm">{location.count}</span>
                  </div>
                  <div className="flex flex-col gap-2">{rows.map(row => renderPerson(row, location.key))}</div>
                </section>
              );
            })}
          </div>
        )}

        {kind === "professions" && (
          <div className="max-h-[68svh] overflow-y-auto flex flex-col gap-4 pr-1">
            {professionRows.filter(row => row.label !== "Não informado" && row.count > 0).map(area => {
              const rows = details.filter(row => row.profession_area === area.label);
              return (
                <section key={area.label} data-profession-area={area.label} className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-[#f0ebe0] font-semibold">{area.label}</h3>
                    <span className="text-[#c9a84c] font-mono text-sm">{area.count}</span>
                  </div>
                  <div className="flex flex-col gap-2">{rows.map(row => renderPerson(row, area.label))}</div>
                </section>
              );
            })}
          </div>
        )}

        {kind === "children" && (
          <>
            <div className="bg-[#0d1a0f] border border-[#c9a84c]/30 p-4">
              <p className="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider">Total agregado</p>
              <p className="text-[#c9a84c] text-4xl font-mono font-bold mt-1">{childrenTotal}</p>
            </div>
            <div className="max-h-[58svh] overflow-y-auto flex flex-col gap-2 pr-1">
              {childrenRows.map(row => {
                const person = peopleById.get(row.person_id);
                if (!person) return null;
                return (
                  <button
                    type="button"
                    key={row.person_id}
                    data-curiosity-child-person-id={row.person_id}
                    onClick={() => onOpenPerson(person)}
                    className="w-full flex items-center justify-between gap-3 border border-[#2d6a4f]/25 bg-[#0d1a0f] hover:border-[#c9a84c]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] px-4 py-3 text-left"
                  >
                    <span className="text-[#f0ebe0] text-sm font-semibold">{row.display_name}</span>
                    <span className="text-[#c9a84c] font-mono text-xs">{row.children_count ?? 0} filho{row.children_count === 1 ? "" : "s"}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </ModalComponent>
  );
}

export function CuriositiesPage({ navigate, auth, people, ModalComponent, PersonDetailModalComponent, HomeMapChartComponent, schoolProfileQuestions, getInitials, normalizeValue }: CuriositiesPageProps) {
  const [polls, setPolls] = useState<(DbPoll & { poll_options?: DbPollOption[] })[]>([]);
  const [results, setResults] = useState<Record<string, Record<string, number>>>({});
  const [myVotes, setMyVotes] = useState<DbPollVote[]>([]);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [questionnaireStats, setQuestionnaireStats] = useState<SchoolQuestionnaireOptionStatRow[]>([]);
  const [questionnaireResponseStats, setQuestionnaireResponseStats] = useState<SchoolQuestionnaireResponseStatsRow | null>(null);
  const [profileStats, setProfileStats] = useState<CuriosityProfileStatsRow | null>(null);
  const [publicDetails, setPublicDetails] = useState<PublicCuriosityProfileDetailRow[]>([]);
  const [activeDrilldown, setActiveDrilldown] = useState<CuriosityDrilldownKind | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<DbPerson | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCuriosities() {
    setLoading(true);
    setError("");
    try {
      const [pollData, questionnaireData, questionnaireResponseData, profileData, locationData, publicDetailData] = await Promise.all([
        getPolls(DEFAULT_EVENT_ID),
        getSchoolQuestionnaireOptionStats(DEFAULT_EVENT_ID).catch(() => []),
        getSchoolQuestionnaireResponseStats(DEFAULT_EVENT_ID).catch(() => null),
        getCuriosityProfileStats(DEFAULT_EVENT_ID).catch(() => null),
        getPublicLocationStats().catch(() => []),
        getPublicCuriosityProfileDetails().catch(() => []),
      ]);
      setPolls(pollData);
      setQuestionnaireStats(questionnaireData);
      setQuestionnaireResponseStats(questionnaireResponseData);
      setProfileStats(profileData);
      setLocations(locationData);
      setPublicDetails(publicDetailData);

      const nextResults: Record<string, Record<string, number>> = {};
      for (const poll of pollData) nextResults[poll.id] = await getPollResults(poll.id);
      setResults(nextResults);
      if (auth.loggedIn) setMyVotes(await getMyPollVotes(auth.userId, pollData.map(p => p.id)));
      else setMyVotes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar curiosidades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCuriosities(); }, [auth.loggedIn, auth.userId]);

  async function submitVote(poll: DbPoll & { poll_options?: DbPollOption[] }, optionId: string) {
    if (!auth.loggedIn) { navigate("login"); return; }
    setBusy(optionId);
    setError("");
    setMessage("");
    try {
      await votePoll({ pollId: poll.id, optionId, userId: auth.userId, allowMultiple: poll.allow_multiple_votes });
      setMessage("Voto registrado.");
      await loadCuriosities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar voto.");
    } finally {
      setBusy(null);
    }
  }

  function totalVotes(pollId: string): number {
    return Object.values(results[pollId] ?? {}).reduce<number>((sum, value) => sum + Number(value), 0);
  }

  const questionGroups = groupQuestionnaireStats(questionnaireStats);
  const relationshipRows = profileStats?.relationship_status_counts ?? [];
  const childrenRows = profileStats?.children_status_counts ?? [];
  const professionRows = profileStats?.profession_area_counts ?? [];

  function openCuriosityPerson(person: DbPerson) {
    setActiveDrilldown(null);
    setSelectedPerson(person);
  }

  return (
    <>
      <CuriosityDrilldownModal
        kind={activeDrilldown}
        details={publicDetails}
        locations={locations}
        professionRows={professionRows}
        childrenTotal={profileStats?.total_children_declared ?? 0}
        people={people}
        onClose={() => setActiveDrilldown(null)}
        onOpenPerson={openCuriosityPerson}
      />
      <PersonDetailModalComponent
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onClaim={() => { setSelectedPerson(null); navigate("claim-profile"); }}
      />
      <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <section className="mb-10 w-full text-left">
          <SectionLabel>Curiosidades da turma</SectionLabel>
          <DisplayTitle className="text-5xl md:text-7xl">O raio-X da Turma 2006</DisplayTitle>
          <p className="mt-4 max-w-[48rem] text-left leading-relaxed text-[#8ab89a]">
            Dados, lembranças, mapa, profissões, relacionamentos e enquetes sobre quem a gente era no HC — e quem a turma se tornou 20 anos depois.
          </p>
        </section>

        {error && <ErrorState message={error} onRetry={loadCuriosities} />}
        {loading && <LoadingState message="Carregando curiosidades..." />}

        {!loading && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" data-curiosities-summary>
              <StatCard label="Ex-alunos 2006" value={publicDetails.length} icon={<Users size={28} />} drilldown="alumni" onClick={() => setActiveDrilldown("alumni")} />
              <StatCard label="Cidades onde estão hoje" value={locations.length} icon={<MapPin size={28} />} drilldown="cities" onClick={() => setActiveDrilldown("cities")} />
              <StatCard label="Áreas profissionais" value={professionRows.filter(row => row.label !== "Não informado" && row.count > 0).length || "—"} icon={<BriefcaseIcon />} drilldown="professions" onClick={() => setActiveDrilldown("professions")} />
              <StatCard label="Total de filhos dos ex-alunos" value={profileStats?.total_children_declared ?? "—"} icon={<Baby size={28} />} drilldown="children" onClick={() => setActiveDrilldown("children")} />
            </section>

            <section className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <SectionLabel>Tempos de escola</SectionLabel>
                  <DisplayTitle className="text-4xl md:text-5xl">O que a turma contou no cadastro</DisplayTitle>
                  <p className="text-[#7a9a7a] mt-3 max-w-2xl">Os gráficos usam respostas multisselecionáveis do questionário de 4 etapas da mini bio.</p>
                  <p data-questionnaire-sample className="text-[#c9a84c] font-mono text-xs mt-2">{questionnaireResponseStats?.respondent_count ?? 0} {(questionnaireResponseStats?.respondent_count ?? 0) === 1 ? "pessoa respondeu" : "pessoas responderam"} o questionário</p>
                </div>
                <Btn variant="outline" onClick={() => navigate("claim-profile")}><UserCheck size={16} />Responder questionário</Btn>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {questionGroups.map(group => (
                  <MiniBarChart key={group.id} title={group.title} rows={group.rows} emptyLabel="Ainda não há respostas suficientes para esta pergunta." />
                ))}
              </div>
            </section>

            <section className="mb-12">
              <SectionLabel>Como a vida seguiu</SectionLabel>
              <DisplayTitle className="text-4xl md:text-5xl mb-2">Relacionamentos, filhos e profissões</DisplayTitle>
              <p data-profile-sample className="text-[#c9a84c] font-mono text-xs mb-6">Base dos gráficos: {profileStats?.total_registered ?? 0} pessoas cadastradas no site</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <MiniBarChart title="Relacionamentos" description="Distribuição agregada dos perfis cadastrados." rows={relationshipRows} />
                <MiniBarChart title="Filhos" description="Dados declarados no cadastro, exibidos somente de forma agregada." rows={childrenRows} />
                <MiniBarChart title="Profissões por área" description="Agrupamento aproximado das profissões informadas publicamente." rows={professionRows} />
              </div>
            </section>

            <section className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <SectionLabel>Mapa da turma</SectionLabel>
                  <DisplayTitle className="text-4xl md:text-5xl">Onde a turma está hoje</DisplayTitle>
                  <p className="text-[#7a9a7a] mt-3 max-w-2xl">Apenas cidades autorizadas nos perfis aparecem aqui.</p>
                </div>
                <Btn variant="outline" onClick={() => navigate("ex-alumni")}><Users size={16} />Ver ex-alunos</Btn>
              </div>
              {locations.length === 0 ? (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
                  <EmptyState icon={<MapPin size={42} />} title="Mapa ainda sem dados públicos" subtitle="As cidades aparecerão conforme os ex-alunos autorizarem a exibição da localização." />
                </div>
              ) : (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-5 md:p-6">
                  <HomeMapChartComponent
                    configs={[
                      { key: "foreign", label: "Exterior" },
                      { key: "other_state", label: "Outros estados" },
                      { key: "interior", label: "Interior do RN" },
                      { key: "natal", label: "Natal/RN" },
                    ] as HomeMapConfig[]}
                    locations={locations}
                  />
                </div>
              )}
            </section>

            <section>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <SectionLabel>Enquetes da turma</SectionLabel>
                  <DisplayTitle className="text-4xl md:text-5xl">Vote nas memórias da turma</DisplayTitle>
                  <p className="text-[#7a9a7a] mt-3 max-w-2xl">As enquetes continuam aqui, agora dentro do painel de curiosidades.</p>
                </div>
              </div>

              {message && <div className="mb-6 bg-[#0d2e1a] border border-[#2d6a4f] p-4 text-[#74c69d] text-sm font-mono">{message}</div>}
              {polls.length === 0 && (
                <EmptyState icon={<BarChart3 size={42} />} title="Nenhuma enquete aberta" subtitle="A organização ainda não abriu votações para a turma." />
              )}

              {polls.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {polls.map(poll => {
                    const options = [...(poll.poll_options ?? [])].sort((a, b) => a.sort_order - b.sort_order);
                    const total = Math.max(totalVotes(poll.id), 1);
                    const votedOptions = myVotes.filter(v => v.poll_id === poll.id).map(v => v.option_id);
                    const hasVoted = votedOptions.length > 0;
                    return (
                      <div key={poll.id} className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Enquete</p>
                            <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-tight">{poll.question}</h3>
                            {poll.description && <p className="text-[#7a9a7a] text-sm mt-2">{poll.description}</p>}
                          </div>
                          <StatusBadge status={poll.status} />
                        </div>

                        <div className="flex flex-col gap-3">
                          {options.map(option => {
                            const count = results[poll.id]?.[option.id] ?? 0;
                            const percent = Math.round((count / total) * 100);
                            const voted = votedOptions.includes(option.id);
                            const disabled = !auth.loggedIn || poll.status !== "open" || busy === option.id || (hasVoted && !poll.allow_multiple_votes);
                            return (
                              <button key={option.id} disabled={disabled} onClick={() => submitVote(poll, option.id)}
                                className={`text-left border p-4 transition-colors disabled:cursor-not-allowed ${voted ? "border-[#c9a84c] bg-[#1a2e1a]" : "border-[#2d6a4f]/25 bg-[#0d1a0f] hover:border-[#2d6a4f]/60"}`}>
                                <div className={`flex items-center justify-between gap-3 ${hasVoted ? "mb-2" : ""}`}>
                                  <span className="text-[#f0ebe0] text-sm font-semibold">{option.option_text}</span>
                                  {hasVoted && <span className="text-[#7a9a7a] font-mono text-xs">{count} voto{count === 1 ? "" : "s"}</span>}
                                </div>
                                {hasVoted && <>
                                  <div className="h-2 bg-[#1a2e1a] overflow-hidden"><div className="h-full bg-[#2d6a4f]" style={{ width: `${percent}%` }} /></div>
                                  <p className="text-[#7a9a7a] font-mono text-[10px] mt-2">{percent}%</p>
                                </>}
                              </button>
                            );
                          })}
                        </div>

                        {!auth.loggedIn && poll.status === "open" && <p className="text-[#c9a84c] text-xs font-mono">Faça login para votar e visualizar os resultados.</p>}
                        {auth.loggedIn && !hasVoted && poll.status === "open" && <p className="text-[#7a9a7a] text-xs font-mono">Os resultados serão exibidos depois do seu voto.</p>}
                        {poll.allow_multiple_votes && <p className="text-[#7a9a7a] text-xs font-mono">Esta enquete permite múltiplos votos.</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
    </>
  );
}

function BriefcaseIcon() {
  return <FileText size={28} />;
}
