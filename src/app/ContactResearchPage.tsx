import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import "./ContactResearchPage.css";
import "./ContactResearchShortcut.css";

type ResearchStatus = "pending" | "located" | "no_contact";
type ClassGroup = "A" | "B" | "C" | "D";
type ResearchSource = "manual" | "device_contact_picker" | "ios_shortcut";

type DirectoryRow = {
  person_id: string;
  full_name: string;
  class_group: ClassGroup;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  notes: string | null;
  research_status: ResearchStatus;
  source: ResearchSource;
  updated_by: string | null;
  updated_at: string | null;
};

type Draft = {
  whatsapp: string;
  instagram: string;
  email: string;
  notes: string;
};

type ImportedContact = {
  name: string;
  phone: string;
  email: string;
};

type RankedCandidate = {
  row: DirectoryRow;
  score: number;
};

const db = supabase as any;
const GROUPS: ClassGroup[] = ["A", "B", "C", "D"];
const NAME_PARTICLES = new Set(["de", "da", "do", "das", "dos", "e"]);
const IOS_SHORTCUT_URL = "https://hc20anos.com.br/buscar#source=ios-shortcut&name=[Nome]&phone=[Telefone]&email=[E-mail]";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@+]+/g, " ")
    .trim();
}

function nameTokens(value: string) {
  return normalizeSearch(value)
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !NAME_PARTICLES.has(token));
}

function scoreName(importedName: string, rosterName: string) {
  const imported = normalizeSearch(importedName);
  const roster = normalizeSearch(rosterName);
  if (!imported || !roster) return 0;
  if (imported === roster) return 100;
  if (imported.includes(roster) || roster.includes(imported)) return 88;

  const importedTokens = nameTokens(importedName);
  const rosterTokens = nameTokens(rosterName);
  if (!importedTokens.length || !rosterTokens.length) return 0;

  const common = importedTokens.filter((token) => rosterTokens.includes(token));
  if (!common.length) return 0;

  let score = (common.length / Math.max(importedTokens.length, rosterTokens.length)) * 70;
  if (importedTokens[0] === rosterTokens[0]) score += 15;
  if (importedTokens[importedTokens.length - 1] === rosterTokens[rosterTokens.length - 1]) score += 15;
  return Math.min(100, Math.round(score));
}

function rankImportedContact(imported: ImportedContact, rows: DirectoryRow[]): RankedCandidate[] {
  return rows
    .map((row) => ({ row, score: scoreName(imported.name, row.full_name) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.row.full_name.localeCompare(b.row.full_name, "pt-BR"))
    .slice(0, 5);
}

function cleanImportedPhone(rawValue: string) {
  const raw = rawValue ?? "";
  if (/^\s+\d/.test(raw)) return `+${raw.trim()}`;
  return raw.trim();
}

function paramsToImportedContact(params: URLSearchParams): ImportedContact | null {
  if (params.get("source") !== "ios-shortcut") return null;

  const name = (params.get("name") ?? "").trim();
  const phone = cleanImportedPhone(params.get("phone") ?? "");
  const email = (params.get("email") ?? "").trim();
  if (!name && !phone && !email) return null;
  return { name, phone, email };
}

function parseShortcutImport(): ImportedContact | null {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.replace(/^#/, "");
  const fromHash = hash ? paramsToImportedContact(new URLSearchParams(hash)) : null;
  if (fromHash) return fromHash;

  return paramsToImportedContact(new URLSearchParams(window.location.search));
}

function clearShortcutPayloadFromAddressBar() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  ["source", "name", "phone", "email"].forEach((key) => url.searchParams.delete(key));
  url.hash = "";
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}

function statusLabel(status: ResearchStatus) {
  if (status === "located") return "Localizado";
  if (status === "no_contact") return "Sem contato";
  return "Pendente";
}

function formatUpdatedAt(value: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function rowDraft(row: DirectoryRow): Draft {
  return {
    whatsapp: row.whatsapp ?? "",
    instagram: row.instagram ?? "",
    email: row.email ?? "",
    notes: row.notes ?? "",
  };
}

export function ContactResearchPage() {
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeGroup, setActiveGroup] = useState<ClassGroup>("A");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ResearchStatus>("all");
  const [editing, setEditing] = useState<DirectoryRow | null>(null);
  const [draft, setDraft] = useState<Draft>({ whatsapp: "", instagram: "", email: "", notes: "" });
  const [draftSource, setDraftSource] = useState<ResearchSource>("manual");
  const [saving, setSaving] = useState(false);
  const [shortcutImport, setShortcutImport] = useState<ImportedContact | null>(() => parseShortcutImport());
  const [shortcutProcessed, setShortcutProcessed] = useState(false);
  const [shortcutCopied, setShortcutCopied] = useState(false);

  async function loadDirectory() {
    setLoading(true);
    setError("");
    const { data, error: rpcError } = await db.rpc("get_contact_research_directory");

    if (rpcError) {
      setRows([]);
      setError("Não foi possível carregar o mutirão. Tente novamente.");
      setLoading(false);
      return;
    }

    setRows((data ?? []) as DirectoryRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void loadDirectory();
  }, []);

  useEffect(() => {
    if (shortcutImport) clearShortcutPayloadFromAddressBar();
  }, [shortcutImport]);

  const summary = useMemo(() => {
    const base = { total: rows.length, located: 0, noContact: 0, pending: 0 };
    for (const row of rows) {
      if (row.research_status === "located") base.located += 1;
      else if (row.research_status === "no_contact") base.noContact += 1;
      else base.pending += 1;
    }
    return base;
  }, [rows]);

  const groupSummary = useMemo(() => {
    const result = new Map<ClassGroup, { total: number; done: number }>();
    for (const group of GROUPS) result.set(group, { total: 0, done: 0 });

    for (const row of rows) {
      const item = result.get(row.class_group);
      if (!item) continue;
      item.total += 1;
      if (row.research_status !== "pending") item.done += 1;
    }

    return result;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalized = normalizeSearch(query);

    return rows.filter((row) => {
      if (row.class_group !== activeGroup) return false;
      if (statusFilter !== "all" && row.research_status !== statusFilter) return false;
      if (!normalized) return true;

      return normalizeSearch(row.full_name).includes(normalized)
        || normalizeSearch(row.whatsapp ?? "").includes(normalized)
        || normalizeSearch(row.instagram ?? "").includes(normalized)
        || normalizeSearch(row.email ?? "").includes(normalized);
    });
  }, [rows, activeGroup, statusFilter, query]);

  const shortcutCandidates = useMemo(
    () => shortcutImport ? rankImportedContact(shortcutImport, rows) : [],
    [shortcutImport, rows],
  );

  function openEditor(row: DirectoryRow, imported?: ImportedContact) {
    const base = rowDraft(row);
    setEditing(row);
    setActiveGroup(row.class_group);
    setDraft(imported ? {
      ...base,
      whatsapp: imported.phone || base.whatsapp,
      email: imported.email || base.email,
    } : base);
    setDraftSource(imported ? "ios_shortcut" : (row.source ?? "manual"));
    setError("");
  }

  useEffect(() => {
    if (shortcutProcessed || !shortcutImport || !rows.length) return;

    const ranked = rankImportedContact(shortcutImport, rows);
    const top = ranked[0];
    const second = ranked[1];
    const confident = top && top.score >= 80 && (!second || top.score - second.score >= 10);

    if (confident) openEditor(top.row, shortcutImport);
    else if (shortcutImport.name) setQuery(shortcutImport.name.split(/\s+/)[0] ?? "");

    setShortcutProcessed(true);
  }, [rows, shortcutImport, shortcutProcessed]);

  function closeEditor() {
    if (saving) return;
    setEditing(null);
  }

  async function saveEditing(options?: { noContact?: boolean }) {
    if (!editing) return;

    setSaving(true);
    setError("");

    const sourceBeingSaved = draftSource;
    const { data, error: rpcError } = await db.rpc("save_contact_research", {
      p_person_id: editing.person_id,
      p_whatsapp: draft.whatsapp,
      p_instagram: draft.instagram,
      p_email: draft.email,
      p_notes: draft.notes,
      p_source: sourceBeingSaved,
      p_mark_no_contact: Boolean(options?.noContact),
    });

    if (rpcError) {
      setError("Não foi possível salvar este contato.");
      setSaving(false);
      return;
    }

    const saved = Array.isArray(data) ? data[0] : data;
    const nextStatus = (saved?.status ?? (options?.noContact ? "no_contact" : "pending")) as ResearchStatus;
    const updatedAt = saved?.updated_at ?? new Date().toISOString();

    setRows((current) => current.map((row) => row.person_id === editing.person_id ? {
      ...row,
      whatsapp: saved?.whatsapp ?? null,
      instagram: saved?.instagram ?? null,
      email: saved?.email ?? null,
      notes: saved?.notes ?? null,
      research_status: nextStatus,
      source: saved?.source ?? sourceBeingSaved,
      updated_by: saved?.updated_by ?? null,
      updated_at: updatedAt,
    } : row));

    if (sourceBeingSaved === "ios_shortcut") setShortcutImport(null);
    setEditing(null);
    setSaving(false);
  }

  function goToNextPending() {
    const pending = rows.find((row) => row.class_group === activeGroup && row.research_status === "pending");
    if (pending) {
      openEditor(pending);
      return;
    }

    const nextGroup = GROUPS.find((group) => rows.some((row) => row.class_group === group && row.research_status === "pending"));
    if (!nextGroup) return;

    setActiveGroup(nextGroup);
    const next = rows.find((row) => row.class_group === nextGroup && row.research_status === "pending");
    if (next) setTimeout(() => openEditor(next), 0);
  }

  async function pickDeviceContact() {
    if (!editing) return;

    const nav = navigator as any;
    if (!nav.contacts?.select) {
      setError("Neste navegador a agenda não pode ser aberta diretamente. No iPhone, use o Atalho HC 2006 descrito nesta página.");
      return;
    }

    try {
      const selected = await nav.contacts.select(["name", "tel", "email"], { multiple: false });
      const contact = selected?.[0];
      if (!contact) return;

      setDraft((current) => ({
        ...current,
        whatsapp: contact.tel?.[0] ?? current.whatsapp,
        email: contact.email?.[0] ?? current.email,
      }));
      setDraftSource("device_contact_picker");
      setError("");
    } catch (pickError) {
      if ((pickError as Error)?.name !== "AbortError") {
        setError("Não foi possível abrir a agenda neste navegador.");
      }
    }
  }

  async function copyShortcutTemplate() {
    try {
      await navigator.clipboard.writeText(IOS_SHORTCUT_URL);
      setShortcutCopied(true);
      window.setTimeout(() => setShortcutCopied(false), 2200);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione e copie o modelo de URL abaixo.");
    }
  }

  if (loading) {
    return <main className="contact-research-shell"><div className="contact-research-state">Carregando mutirão de contatos…</div></main>;
  }

  if (error && rows.length === 0) {
    return <main className="contact-research-shell"><div className="contact-research-state">
      <h1>Não foi possível abrir o mutirão</h1>
      <p>{error}</p>
      <button type="button" onClick={() => void loadDirectory()}>Tentar novamente</button>
    </div></main>;
  }

  return <main className="contact-research-shell">
    <header className="contact-research-header">
      <div>
        <span className="contact-research-kicker">2006 — 2026</span>
        <h1>Mutirão de contatos</h1>
        <p>Localize os colegas e ajude a completar a lista do reencontro.</p>
      </div>
    </header>

    <section className="contact-research-summary" aria-label="Resumo do mutirão">
      <div><strong>{summary.total}</strong><span>ex-alunos</span></div>
      <div><strong>{summary.located}</strong><span>localizados</span></div>
      <div><strong>{summary.pending}</strong><span>pendentes</span></div>
      <div><strong>{summary.noContact}</strong><span>sem contato</span></div>
    </section>

    <section className="contact-research-device-guide" aria-labelledby="contact-research-device-title">
      <div className="contact-research-device-guide-head">
        <span>Como colaborar</span>
        <h2 id="contact-research-device-title">Escolha o jeito que funciona no seu dispositivo</h2>
        <p>Você pode atualizar os contatos pelo Android, pelo iPhone ou pelo computador. Em todos os casos, nada é salvo sem você conferir e confirmar.</p>
      </div>

      <div className="contact-research-device-grid">
        <article className="contact-research-device-card">
          <span className="contact-research-device-badge">Android</span>
          <h3>Importe direto da agenda</h3>
          <ol>
            <li>Abra o nome de um colega na lista.</li>
            <li>Toque em <strong>Importar da agenda do celular</strong>.</li>
            <li>Escolha a pessoa na sua agenda.</li>
            <li>Confira telefone e e-mail e toque em <strong>Salvar</strong>.</li>
          </ol>
          <p>Funciona em navegadores Android compatíveis. Se a agenda não abrir, você ainda pode preencher os campos manualmente.</p>
        </article>

        <article className="contact-research-device-card is-iphone">
          <span className="contact-research-device-badge">iPhone</span>
          <h3>Compartilhe o contato pelo Atalho</h3>
          <ol>
            <li>Configure uma única vez o atalho <strong>Enviar para HC 2006</strong>.</li>
            <li>No app Contatos, abra a pessoa e toque em <strong>Compartilhar Contato</strong>.</li>
            <li>Escolha <strong>Enviar para HC 2006</strong>.</li>
            <li>O site procura o nome, preenche telefone e e-mail e pede sua confirmação antes de salvar.</li>
          </ol>
          <p>O passo a passo para configurar o Atalho está logo abaixo.</p>
        </article>

        <article className="contact-research-device-card">
          <span className="contact-research-device-badge">Computador</span>
          <h3>Preencha manualmente</h3>
          <ol>
            <li>Procure o colega por nome ou turma.</li>
            <li>Clique no nome para abrir o cadastro.</li>
            <li>Digite ou cole WhatsApp, Instagram, e-mail e alguma observação útil.</li>
            <li>Confira os dados e clique em <strong>Salvar</strong>.</li>
          </ol>
          <p>Você não precisa ter todos os dados: WhatsApp, Instagram ou e-mail já é suficiente para marcar o colega como localizado.</p>
        </article>
      </div>

      <p className="contact-research-device-privacy">Em qualquer dispositivo: confira se o contato corresponde à pessoa certa antes de salvar. Os dados só entram no mutirão depois da sua confirmação.</p>
    </section>

    <details className="contact-research-ios-setup">
      <summary><span>iPhone</span> Configurar “Enviar para HC 2006”</summary>
      <div className="contact-research-ios-setup-body">
        <p>O Safari não abre a agenda diretamente, mas o app Atalhos pode receber um cartão compartilhado pelo app Contatos e enviar somente nome, telefone e e-mail para esta página.</p>
        <ol>
          <li>No app <strong>Atalhos</strong>, crie um atalho chamado <strong>Enviar para HC 2006</strong> e ative <strong>Mostrar na Folha de Compartilhamento</strong>.</li>
          <li>Defina a entrada aceita como <strong>Contatos</strong>.</li>
          <li>Obtenha do contato recebido os detalhes <strong>Nome</strong>, <strong>Números de Telefone</strong> e <strong>Endereços de E-mail</strong>. Para telefone e e-mail, use o primeiro item ou adicione “Escolher da Lista”.</li>
          <li>Adicione a ação <strong>URL</strong> e monte o endereço abaixo usando as variáveis mágicas correspondentes.</li>
          <li>Finalize com <strong>Abrir URLs</strong>. Depois, no app Contatos: <strong>Compartilhar Contato → Enviar para HC 2006</strong>.</li>
        </ol>
        <code className="contact-research-shortcut-url">{IOS_SHORTCUT_URL}</code>
        <div className="contact-research-ios-actions">
          <button type="button" onClick={() => void copyShortcutTemplate()}>{shortcutCopied ? "Modelo copiado" : "Copiar modelo de URL"}</button>
          <a href="shortcuts://create-shortcut">Abrir editor de Atalhos</a>
        </div>
        <p className="contact-research-ios-note">Os dados viajam no fragmento <code>#</code> do endereço: eles não fazem parte da requisição HTTP ao servidor. Nada é salvo até você confirmar no editor.</p>
      </div>
    </details>

    {shortcutImport && !editing && <section className="contact-research-shortcut-banner" aria-live="polite">
      <div className="contact-research-shortcut-heading">
        <div>
          <span>Recebido do iPhone</span>
          <h2>{shortcutImport.name || "Contato sem nome"}</h2>
        </div>
        <button type="button" onClick={() => setShortcutImport(null)} aria-label="Descartar contato recebido">×</button>
      </div>
      <div className="contact-research-shortcut-data">
        {shortcutImport.phone && <span><strong>Telefone</strong>{shortcutImport.phone}</span>}
        {shortcutImport.email && <span><strong>E-mail</strong>{shortcutImport.email}</span>}
      </div>
      {shortcutCandidates.length > 0 ? <>
        <p>Confirme a pessoa correspondente na lista HC 2006:</p>
        <div className="contact-research-shortcut-candidates">
          {shortcutCandidates.map(({ row, score }) => <button type="button" key={row.person_id} onClick={() => openEditor(row, shortcutImport)}>
            <strong>{row.full_name}</strong>
            <span>Turma {row.class_group}{score >= 80 ? " · correspondência forte" : ""}</span>
          </button>)}
        </div>
      </> : <p>Nenhum nome parecido foi encontrado. Use a busca abaixo e abra manualmente a pessoa correta; o contato recebido permanecerá disponível até ser descartado.</p>}
    </section>}

    <section className="contact-research-toolbar">
      <div className="contact-research-tabs" role="tablist" aria-label="Turmas">
        {GROUPS.map((group) => {
          const counts = groupSummary.get(group) ?? { total: 0, done: 0 };
          return <button
            key={group}
            type="button"
            role="tab"
            aria-selected={activeGroup === group}
            className={activeGroup === group ? "is-active" : ""}
            onClick={() => setActiveGroup(group)}
          >
            <span>Turma {group}</span>
            <small>{counts.done}/{counts.total}</small>
          </button>;
        })}
      </div>

      <div className="contact-research-search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, telefone, @ ou e-mail"
          aria-label="Buscar ex-aluno"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filtrar por status">
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="located">Localizados</option>
          <option value="no_contact">Sem contato</option>
        </select>
      </div>
    </section>

    {error && <div className="contact-research-error contact-research-page-error">{error}</div>}

    <section className="contact-research-list-section">
      <div className="contact-research-section-title">
        <div><span>Turma {activeGroup}</span><strong>{filteredRows.length} registro(s)</strong></div>
        <button type="button" onClick={goToNextPending}>Próximo pendente</button>
      </div>

      <div className="contact-research-table-wrap">
        <table className="contact-research-table">
          <thead><tr><th>Nome</th><th>WhatsApp</th><th>Instagram</th><th>E-mail</th><th>Observação</th><th>Status</th></tr></thead>
          <tbody>
            {filteredRows.map((row) => <tr key={row.person_id} onClick={() => openEditor(row, shortcutImport ?? undefined)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openEditor(row, shortcutImport ?? undefined); }}>
              <td data-label="Nome"><strong>{row.full_name}</strong>{row.updated_at && <small>Atualizado {formatUpdatedAt(row.updated_at)}</small>}</td>
              <td data-label="WhatsApp">{row.whatsapp || "—"}</td>
              <td data-label="Instagram">{row.instagram || "—"}</td>
              <td data-label="E-mail">{row.email || "—"}</td>
              <td data-label="Observação">{row.notes || "—"}</td>
              <td data-label="Status"><span className={`contact-research-status status-${row.research_status}`}>{statusLabel(row.research_status)}</span></td>
            </tr>)}
          </tbody>
        </table>
        {!filteredRows.length && <div className="contact-research-empty">Nenhum registro encontrado com estes filtros.</div>}
      </div>
    </section>

    {editing && <div className="contact-research-modal" role="dialog" aria-modal="true" aria-labelledby="contact-editor-title" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}>
      <section className="contact-research-editor">
        <div className="contact-research-editor-head">
          <div><span>Turma {editing.class_group}</span><h2 id="contact-editor-title">{editing.full_name}</h2></div>
          <button type="button" aria-label="Fechar" onClick={closeEditor}>×</button>
        </div>

        {draftSource === "ios_shortcut" && <div className="contact-research-shortcut-notice">
          Dados recebidos do Atalho do iPhone. Confira telefone e e-mail antes de salvar.
        </div>}

        <button className="contact-research-contact-picker" type="button" onClick={() => void pickDeviceContact()}>
          Importar da agenda do celular
        </button>
        <p className="contact-research-picker-help">No Android compatível, a agenda abre aqui. No iPhone, compartilhe o contato pelo atalho “Enviar para HC 2006”.</p>

        <div className="contact-research-fields">
          <label>WhatsApp<input value={draft.whatsapp} onChange={(event) => { setDraft({ ...draft, whatsapp: event.target.value }); if (draftSource !== "ios_shortcut") setDraftSource("manual"); }} inputMode="tel" placeholder="(84) 99999-9999" /></label>
          <label>Instagram<input value={draft.instagram} onChange={(event) => { setDraft({ ...draft, instagram: event.target.value }); if (draftSource !== "ios_shortcut") setDraftSource("manual"); }} placeholder="@usuario" autoCapitalize="none" /></label>
          <label>E-mail<input value={draft.email} onChange={(event) => { setDraft({ ...draft, email: event.target.value }); if (draftSource !== "ios_shortcut") setDraftSource("manual"); }} inputMode="email" placeholder="nome@email.com" autoCapitalize="none" /></label>
          <label>Observação<textarea value={draft.notes} onChange={(event) => { setDraft({ ...draft, notes: event.target.value }); if (draftSource !== "ios_shortcut") setDraftSource("manual"); }} rows={3} placeholder="Ex.: número antigo, confirmar e-mail, contato via colega…" /></label>
        </div>

        <div className="contact-research-editor-actions">
          <button className="contact-research-no-contact" type="button" disabled={saving} onClick={() => void saveEditing({ noContact: true })}>Marcar sem contato</button>
          <button className="contact-research-save" type="button" disabled={saving} onClick={() => void saveEditing()}>{saving ? "Salvando…" : "Salvar"}</button>
        </div>
      </section>
    </div>}
  </main>;
}
