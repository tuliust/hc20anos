import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import "./ContactResearchPage.css";

type ResearchStatus = "pending" | "located" | "no_contact";
type ClassGroup = "A" | "B" | "C" | "D";
type ResearchSource = "manual" | "device_contact_picker";

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

const db = supabase as any;
const GROUPS: ClassGroup[] = ["A", "B", "C", "D"];

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

  function openEditor(row: DirectoryRow) {
    setEditing(row);
    setDraft(rowDraft(row));
    setDraftSource(row.source ?? "manual");
    setError("");
  }

  function closeEditor() {
    if (saving) return;
    setEditing(null);
  }

  async function saveEditing(options?: { noContact?: boolean }) {
    if (!editing) return;

    setSaving(true);
    setError("");

    const { data, error: rpcError } = await db.rpc("save_contact_research", {
      p_person_id: editing.person_id,
      p_whatsapp: draft.whatsapp,
      p_instagram: draft.instagram,
      p_email: draft.email,
      p_notes: draft.notes,
      p_source: draftSource,
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
      source: saved?.source ?? draftSource,
      updated_by: saved?.updated_by ?? null,
      updated_at: updatedAt,
    } : row));

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
      setError("Seu navegador não permite importar contatos diretamente. Preencha os campos manualmente.");
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
            {filteredRows.map((row) => <tr key={row.person_id} onClick={() => openEditor(row)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openEditor(row); }}>
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

        <button className="contact-research-contact-picker" type="button" onClick={() => void pickDeviceContact()}>
          Importar da agenda do celular
        </button>
        <p className="contact-research-picker-help">Quando suportado pelo navegador, você escolhe apenas um contato. A aplicação não recebe sua agenda inteira.</p>

        <div className="contact-research-fields">
          <label>WhatsApp<input value={draft.whatsapp} onChange={(event) => { setDraft({ ...draft, whatsapp: event.target.value }); setDraftSource("manual"); }} inputMode="tel" placeholder="(84) 99999-9999" /></label>
          <label>Instagram<input value={draft.instagram} onChange={(event) => { setDraft({ ...draft, instagram: event.target.value }); setDraftSource("manual"); }} placeholder="@usuario" autoCapitalize="none" /></label>
          <label>E-mail<input value={draft.email} onChange={(event) => { setDraft({ ...draft, email: event.target.value }); setDraftSource("manual"); }} inputMode="email" placeholder="nome@email.com" autoCapitalize="none" /></label>
          <label>Observação<textarea value={draft.notes} onChange={(event) => { setDraft({ ...draft, notes: event.target.value }); setDraftSource("manual"); }} rows={3} placeholder="Ex.: número antigo, confirmar e-mail, contato via colega…" /></label>
        </div>

        <div className="contact-research-editor-actions">
          <button className="contact-research-no-contact" type="button" disabled={saving} onClick={() => void saveEditing({ noContact: true })}>Marcar sem contato</button>
          <button className="contact-research-save" type="button" disabled={saving} onClick={() => void saveEditing()}>{saving ? "Salvando…" : "Salvar"}</button>
        </div>
      </section>
    </div>}
  </main>;
}
