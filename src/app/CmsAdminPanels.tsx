import { useEffect, useMemo, useState } from "react";
import {
  CMS_EVENT_ID,
  DEFAULT_CMS_ASSETS,
  PUBLIC_PAGE_CONFIG,
  getCmsContentHealth,
  getPublicPageContentMap,
  listCmsAssets,
  saveCmsAssets,
  savePublicPageContent,
  uploadCmsAssetFile,
  type CmsAsset,
  type CmsHealthRow,
  type PublicPageSlug,
} from "../lib/cmsAdmin";
import {
  getEventPageContent,
  getHomePageContent,
  updateEventPageContent,
  updateHomePageContent,
  type EventPageContent,
  type HomePageContent,
} from "../lib/services";

const HOME_DYNAMIC_FIELDS = [
  { key: "home_alumni_overview_json", label: "Painel “A turma em movimento”", rows: 12, help: "Textos e labels dos 4 cards do preview de ex-alunos." },
  { key: "home_nostalgia_timeline_json", label: "Timeline nostálgica", rows: 10, help: "Itens da timeline. Ícones aceitos: phone-call, laptop, messages-square, proportions, smartphone, book-image." },
  { key: "home_profile_stats_json", label: "Estatísticas do card Perfil", rows: 8, help: "Use mode:auto para calcular por profiles/people ou mode:fixed com value." },
  { key: "home_map_stats_json", label: "Estatísticas do card Mapa da turma", rows: 8, help: "Use mode:auto para calcular por cidade/estado/país dos perfis ou mode:fixed com value." },
  { key: "home_poll_fallback_json", label: "Fallback da enquete da Home", rows: 6, help: "Usado quando não houver enquete aberta em Supabase polls." },
] as const;

const EVENT_EXTRA_TEXT_FIELDS = [
  { key: "local_section_eyebrow", label: "Local — eyebrow", placeholder: "Local" },
  { key: "local_section_title", label: "Local — título", placeholder: "Como chegar" },
  { key: "program_section_eyebrow", label: "Programação — eyebrow", placeholder: "Programação" },
  { key: "program_section_title", label: "Programação — título", placeholder: "Horários e atrações" },
  { key: "program_image_url", label: "Programação — imagem", placeholder: "URL pública da imagem no Supabase Storage" },
  { key: "program_image_alt", label: "Programação — texto alternativo", placeholder: "Descrição da imagem" },
  { key: "structure_section_eyebrow", label: "Estrutura — eyebrow", placeholder: "Estrutura" },
  { key: "structure_section_title", label: "Estrutura — título", placeholder: "Bar, comidas, banheiros e segurança" },
] as const;

const DEFAULT_STRUCTURE_CARDS = [
  { title: "Estacionamento", description: "Consulte a organização sobre vagas, pontos de embarque/desembarque e opções próximas ao local." },
  { title: "Área Kids", description: "Espaço pensado para apoio às famílias, conforme estrutura final contratada para o evento." },
  { title: "Registro de fotos e vídeos", description: "A noite terá registros oficiais para preservar os principais momentos do reencontro." },
];

type StatusTone = "ok" | "error" | "muted";

type CmsAdminPanelsProps = {
  adminId?: string | null;
  canManageEvent?: boolean;
  onHomeContentUpdated?: (content: HomePageContent) => void;
};

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function prettyJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value ?? {}, null, 2);
}

function parseJsonField(raw: string, fallback: unknown) {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  return JSON.parse(trimmed);
}

function PanelShell({
  title,
  description,
  actions,
  children,
  status,
  tone = "muted",
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  status?: string;
  tone?: StatusTone;
}) {
  return (
    <section className="bg-[#141f14] border border-[#2d6a4f]/25 p-6 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">{title}</p>
          <p className="text-[#3a5a3a] text-xs mt-1">{description}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
      {status && (
        <div className="mt-5 border-t border-[#2d6a4f]/20 pt-4">
          <p className={classNames(
            "text-xs font-mono",
            tone === "error" && "text-[#e74c3c]",
            tone === "ok" && "text-[#74c69d]",
            tone === "muted" && "text-[#7a9a7a]",
          )}>{status}</p>
        </div>
      )}
    </section>
  );
}

function CmsButton({ primary, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button
      {...props}
      className={classNames(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] transition-colors disabled:opacity-50",
        primary ? "bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c]" : "border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a]",
        props.className,
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full bg-[#0a120a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-3 px-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-[#c9a84c]"
      />
    </label>
  );
}

function JsonArea({ label, value, rows, help, onChange }: {
  label: string;
  value: string;
  rows: number;
  help?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full bg-[#0a120a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-3 px-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-[#c9a84c]"
      />
      {help && <span className="block text-[#3a5a3a] text-[11px] mt-2">{help}</span>}
    </label>
  );
}

export function CmsHealthPanel() {
  const [rows, setRows] = useState<CmsHealthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHealth() {
    setLoading(true);
    setError("");
    try {
      setRows(await getCmsContentHealth(CMS_EVENT_ID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível verificar a saúde do CMS.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadHealth(); }, []);

  return (
    <PanelShell
      title="Saúde do CMS"
      description="Verifica se as páginas dependem de conteúdo configurado no Supabase, não de fallbacks editoriais."
      actions={<CmsButton onClick={loadHealth} disabled={loading}>Verificar novamente</CmsButton>}
    >
      <div className="grid grid-cols-1 gap-3">
        {loading && <div className="border border-[#2d6a4f]/20 bg-[#0a120a] px-4 py-3 text-[#7a9a7a] text-xs font-mono uppercase tracking-[0.14em]">Verificando...</div>}
        {error && <HealthRow row={{ label: "Erro na verificação", ok: false, detail: error }} />}
        {!loading && !error && rows.map(row => <HealthRow key={row.label} row={row} />)}
      </div>
    </PanelShell>
  );
}

function HealthRow({ row }: { row: CmsHealthRow }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border border-[#2d6a4f]/20 bg-[#0a120a] px-4 py-3">
      <span className={classNames("mt-0.5 h-2.5 w-2.5 rounded-full", row.ok ? "bg-[#74c69d]" : "bg-[#e74c3c]")} />
      <div>
        <p className="text-[#f0ebe0] text-sm font-semibold">{row.label}</p>
        <p className="text-[#7a9a7a] text-xs font-mono mt-1 break-words">{row.detail}</p>
      </div>
    </div>
  );
}

export function PublicPagesCmsPanel({ adminId, canManageEvent = true }: CmsAdminPanelsProps) {
  const [draft, setDraft] = useState<Record<PublicPageSlug, string>>({
    "ex-alunos": "{}",
    memorias: "{}",
    curiosidades: "{}",
    "pos-festa": "{}",
  });
  const [status, setStatus] = useState("Conteúdo carregado de public_page_content.");
  const [tone, setTone] = useState<StatusTone>("muted");
  const [busy, setBusy] = useState(false);

  async function loadPages() {
    setBusy(true);
    setTone("muted");
    setStatus("Carregando páginas públicas...");
    try {
      const map = await getPublicPageContentMap(CMS_EVENT_ID);
      const next = { ...draft };
      for (const page of PUBLIC_PAGE_CONFIG) next[page.slug] = prettyJson(map.get(page.slug) ?? {});
      setDraft(next);
      setStatus("Conteúdo carregado de public_page_content.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível carregar páginas públicas.");
    } finally {
      setBusy(false);
    }
  }

  async function savePages() {
    if (!canManageEvent) return;
    setBusy(true);
    setTone("muted");
    setStatus("Salvando...");
    try {
      await savePublicPageContent(
        PUBLIC_PAGE_CONFIG.map(page => ({ page_slug: page.slug, content_json: parseJsonField(draft[page.slug], {}) as Record<string, unknown> })),
        CMS_EVENT_ID,
        adminId,
      );
      setTone("ok");
      setStatus("Páginas públicas salvas no Supabase.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível salvar páginas públicas.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadPages(); }, []);

  return (
    <PanelShell
      title="CMS das páginas públicas"
      description="Edite textos e regras das páginas Ex-alunos, Memórias, Curiosidades e Pós-festa."
      status={status}
      tone={tone}
      actions={<><CmsButton onClick={loadPages} disabled={busy}>Recarregar</CmsButton><CmsButton primary onClick={savePages} disabled={busy || !canManageEvent}>Salvar páginas</CmsButton></>}
    >
      <div className="grid grid-cols-1 gap-5">
        {PUBLIC_PAGE_CONFIG.map(page => (
          <JsonArea
            key={page.slug}
            label={page.label}
            rows={page.rows}
            value={draft[page.slug]}
            onChange={value => setDraft(current => ({ ...current, [page.slug]: value }))}
          />
        ))}
      </div>
    </PanelShell>
  );
}

export function CmsAssetsPanel({ adminId, canManageEvent = true }: CmsAdminPanelsProps) {
  const [assets, setAssets] = useState<CmsAsset[]>(DEFAULT_CMS_ASSETS);
  const [status, setStatus] = useState("Assets carregados de cms_assets.");
  const [tone, setTone] = useState<StatusTone>("muted");
  const [busy, setBusy] = useState(false);

  async function loadAssets() {
    setBusy(true);
    setTone("muted");
    setStatus("Carregando assets...");
    try {
      setAssets(await listCmsAssets(CMS_EVENT_ID));
      setStatus("Assets carregados de cms_assets.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível carregar assets.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAssets() {
    if (!canManageEvent) return;
    setBusy(true);
    setTone("muted");
    setStatus("Salvando assets...");
    try {
      await saveCmsAssets(assets, CMS_EVENT_ID, adminId);
      setTone("ok");
      setStatus("Assets salvos no Supabase.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível salvar assets.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAsset(index: number, file?: File | null) {
    if (!file || !canManageEvent) return;
    setBusy(true);
    setTone("muted");
    setStatus("Enviando imagem...");
    try {
      const asset = assets[index];
      const uploaded = await uploadCmsAssetFile(file, asset?.asset_key || "asset", CMS_EVENT_ID);
      setAssets(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, file_url: uploaded.publicUrl, storage_path: uploaded.storagePath } : item));
      setTone("ok");
      setStatus("Upload concluído. Salve os assets para persistir os metadados.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  function updateAsset(index: number, patch: Partial<CmsAsset>) {
    setAssets(current => current.map((asset, itemIndex) => itemIndex === index ? { ...asset, ...patch } : asset));
  }

  useEffect(() => { void loadAssets(); }, []);

  return (
    <PanelShell
      title="CMS de imagens e assets"
      description="Gerencie URLs públicas, textos alternativos e uploads usados pelas páginas do evento."
      status={status}
      tone={tone}
      actions={<><CmsButton onClick={() => setAssets(current => [...current, { event_id: CMS_EVENT_ID, asset_key: "novo_asset", label: "Novo asset", sort_order: current.length * 10, is_active: true }])}>Adicionar asset</CmsButton><CmsButton onClick={loadAssets} disabled={busy}>Recarregar</CmsButton><CmsButton primary onClick={saveAssets} disabled={busy || !canManageEvent}>Salvar assets</CmsButton></>}
    >
      <div className="grid grid-cols-1 gap-4">
        {assets.map((asset, index) => (
          <article key={`${asset.asset_key}-${index}`} className="bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_96px] gap-3 items-end">
              <Field label="Chave técnica" value={asset.asset_key ?? ""} onChange={value => updateAsset(index, { asset_key: value })} placeholder="event_program_image" />
              <Field label="Label no Admin" value={asset.label ?? ""} onChange={value => updateAsset(index, { label: value })} />
              <Field label="Ordem" type="number" value={String(asset.sort_order ?? index * 10)} onChange={value => updateAsset(index, { sort_order: Number(value || 0) })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end mt-3">
              <Field label="URL pública" value={asset.file_url ?? ""} onChange={value => updateAsset(index, { file_url: value || null })} placeholder="https://..." />
              <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a] transition-colors cursor-pointer">
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={event => void uploadAsset(index, event.target.files?.[0])} />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <Field label="Texto alternativo" value={asset.alt_text ?? ""} onChange={value => updateAsset(index, { alt_text: value || null })} />
              <Field label="Contexto de uso" value={asset.usage_context ?? ""} onChange={value => updateAsset(index, { usage_context: value || null })} placeholder="event.program" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end mt-3">
              <Field label="Legenda" value={asset.caption ?? ""} onChange={value => updateAsset(index, { caption: value || null })} />
              <label className="flex items-center gap-3 border border-[#2d6a4f]/25 text-[#f0ebe0] px-4 py-3 cursor-pointer">
                <input type="checkbox" className="accent-[#2d6a4f]" checked={asset.is_active !== false} onChange={event => updateAsset(index, { is_active: event.target.checked })} />
                <span className="text-xs font-mono uppercase tracking-[0.14em]">Ativo</span>
              </label>
            </div>
            {asset.file_url && <figure className="mt-4 border border-[#2d6a4f]/20 bg-[#141f14] p-3"><img src={asset.file_url} alt={asset.alt_text || asset.label} className="w-full max-h-52 object-cover" loading="lazy" /></figure>}
          </article>
        ))}
      </div>
    </PanelShell>
  );
}

export function HomeDynamicCmsPanel({ adminId, canManageEvent = true, onHomeContentUpdated }: CmsAdminPanelsProps) {
  const [pollId, setPollId] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries(HOME_DYNAMIC_FIELDS.map(field => [field.key, ""])));
  const [status, setStatus] = useState("Campos carregados do Supabase.");
  const [tone, setTone] = useState<StatusTone>("muted");
  const [busy, setBusy] = useState(false);

  async function loadContent() {
    setBusy(true);
    setTone("muted");
    setStatus("Carregando Home dinâmica...");
    try {
      const content = await getHomePageContent(CMS_EVENT_ID) as HomePageContent & Record<string, unknown>;
      setPollId(String(content.home_poll_id ?? ""));
      setDraft(Object.fromEntries(HOME_DYNAMIC_FIELDS.map(field => [field.key, prettyJson(content[field.key] ?? "")] )));
      setStatus("Campos carregados do Supabase.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível carregar extras da Home.");
    } finally {
      setBusy(false);
    }
  }

  async function saveContent() {
    if (!canManageEvent) return;
    setBusy(true);
    setTone("muted");
    setStatus("Salvando...");
    try {
      const payload: Record<string, unknown> = { event_id: CMS_EVENT_ID, home_poll_id: pollId.trim() || null };
      for (const field of HOME_DYNAMIC_FIELDS) {
        const value = draft[field.key]?.trim() ?? "";
        if (value) JSON.parse(value);
        payload[field.key] = value;
      }
      const updated = await updateHomePageContent(CMS_EVENT_ID, payload as Partial<HomePageContent>, adminId ?? undefined);
      onHomeContentUpdated?.(updated);
      setTone("ok");
      setStatus("Extras da Home salvos no Supabase.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível salvar extras da Home.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadContent(); }, []);

  return (
    <PanelShell
      title="Home dinâmica"
      description="Gerencie previews, estatísticas, timeline e fallback da enquete exibidos na Home."
      status={status}
      tone={tone}
      actions={<><CmsButton onClick={loadContent} disabled={busy}>Recarregar</CmsButton><CmsButton primary onClick={saveContent} disabled={busy || !canManageEvent}>Salvar extras</CmsButton></>}
    >
      <div className="grid grid-cols-1 gap-5">
        <Field label="ID da enquete da Home" value={pollId} onChange={setPollId} placeholder="Opcional. Se vazio, usa a primeira enquete aberta." />
        {HOME_DYNAMIC_FIELDS.map(field => (
          <JsonArea
            key={field.key}
            label={field.label}
            rows={field.rows}
            help={field.help}
            value={draft[field.key] ?? ""}
            onChange={value => setDraft(current => ({ ...current, [field.key]: value }))}
          />
        ))}
      </div>
    </PanelShell>
  );
}

export function EventAdvancedCmsPanel({ adminId, canManageEvent = true }: CmsAdminPanelsProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [showGalleryPreview, setShowGalleryPreview] = useState(false);
  const [structureCardsJson, setStructureCardsJson] = useState(prettyJson(DEFAULT_STRUCTURE_CARDS));
  const [status, setStatus] = useState("Campos carregados de event_page_content.");
  const [tone, setTone] = useState<StatusTone>("muted");
  const [busy, setBusy] = useState(false);

  async function loadContent() {
    setBusy(true);
    setTone("muted");
    setStatus("Carregando CMS do evento...");
    try {
      const content = await getEventPageContent(CMS_EVENT_ID) as EventPageContent & Record<string, unknown>;
      setDraft(Object.fromEntries(EVENT_EXTRA_TEXT_FIELDS.map(field => [field.key, String(content[field.key] ?? "")] )));
      setShowGalleryPreview(content.show_gallery_preview === true);
      setStructureCardsJson(prettyJson(content.structure_cards_json ?? DEFAULT_STRUCTURE_CARDS));
      setStatus("Campos carregados de event_page_content.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível carregar CMS do evento.");
    } finally {
      setBusy(false);
    }
  }

  async function saveContent() {
    if (!canManageEvent) return;
    setBusy(true);
    setTone("muted");
    setStatus("Salvando...");
    try {
      const payload: Record<string, unknown> = { event_id: CMS_EVENT_ID };
      for (const field of EVENT_EXTRA_TEXT_FIELDS) payload[field.key] = draft[field.key]?.trim() || null;
      payload.show_gallery_preview = showGalleryPreview;
      payload.structure_cards_json = parseJsonField(structureCardsJson, []);
      await updateEventPageContent(CMS_EVENT_ID, payload as Partial<EventPageContent>, adminId ?? undefined);
      setTone("ok");
      setStatus("CMS do evento salvo no Supabase.");
    } catch (err) {
      setTone("error");
      setStatus(err instanceof Error ? err.message : "Não foi possível salvar CMS do evento.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadContent(); }, []);

  return (
    <PanelShell
      title="CMS avançado do Evento"
      description="Campos usados para remover textos e imagens hardcoded da página /evento."
      status={status}
      tone={tone}
      actions={<><CmsButton onClick={loadContent} disabled={busy}>Recarregar</CmsButton><CmsButton primary onClick={saveContent} disabled={busy || !canManageEvent}>Salvar CMS do evento</CmsButton></>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EVENT_EXTRA_TEXT_FIELDS.map(field => (
          <Field
            key={field.key}
            label={field.label}
            value={draft[field.key] ?? ""}
            placeholder={field.placeholder}
            onChange={value => setDraft(current => ({ ...current, [field.key]: value }))}
          />
        ))}
        <label className="md:col-span-2 flex items-center gap-3 bg-[#0a120a] border border-[#2d6a4f]/25 p-4 cursor-pointer">
          <input type="checkbox" className="accent-[#2d6a4f]" checked={showGalleryPreview} onChange={event => setShowGalleryPreview(event.target.checked)} />
          <span className="text-[#f0ebe0] text-sm">Exibir seção Fotos / Prévia do evento</span>
        </label>
        <div className="md:col-span-2">
          <JsonArea label="Cards adicionais da estrutura" rows={8} value={structureCardsJson} onChange={setStructureCardsJson} help="JSON editável. Cada item aceita title e description." />
        </div>
      </div>
    </PanelShell>
  );
}

export default function CmsAdminPanels(props: CmsAdminPanelsProps) {
  const panels = useMemo(() => [
    <HomeDynamicCmsPanel key="home" {...props} />,
    <EventAdvancedCmsPanel key="event" {...props} />,
    <PublicPagesCmsPanel key="public-pages" {...props} />,
    <CmsAssetsPanel key="assets" {...props} />,
    <CmsHealthPanel key="health" />,
  ], [props.adminId, props.canManageEvent, props.onHomeContentUpdated]);

  return <>{panels}</>;
}
