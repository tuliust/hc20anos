import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, RefreshCw, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";
const CATALOG_UPDATED_EVENT = "hc-ticket-catalog-updated";

type ProductGroup = "alumni" | "family" | "guest";

type AdminProduct = {
  id: string;
  product_code?: string | null;
  name: string;
  description?: string | null;
};

type AdminLotsPayload = {
  products?: AdminProduct[];
};

const GROUPS: Array<{ id: ProductGroup; label: string; fallback: string }> = [
  { id: "alumni", label: "Ingresso Ex-Aluno", fallback: "Ingresso individual para ex-aluno da Turma 2006." },
  { id: "family", label: "Ingresso Família", fallback: "Ingresso para o ex-aluno e seus familiares." },
  { id: "guest", label: "Ingresso Convidado", fallback: "Ingresso para convidado externo aprovado por um ex-aluno." },
];

function normalizedPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function isLotsRoute() {
  const path = normalizedPath();
  const tab = new URLSearchParams(window.location.search).get("tab");
  return tab === "lots" && (path === "/admin/tickets" || path === "/admin");
}

function groupForProduct(code: string | null | undefined, name: string): ProductGroup | null {
  const explicit = String(code ?? "").trim();
  if (explicit === "simple") return "alumni";
  if (explicit === "family_full" || explicit === "family_single_parent") return "family";
  if (explicit === "external_guest") return "guest";

  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
  if (normalized.includes("convidado")) return "guest";
  if (normalized.includes("familia") || normalized.includes("casal")) return "family";
  if (normalized.includes("ex-aluno") || normalized.includes("ex aluno") || normalized.includes("individual")) return "alumni";
  return null;
}

function findLotsPanel() {
  return document.querySelector<HTMLElement>("[data-admin-ticket-lots-panel='true']");
}

function ProductCopyPanel() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [subtitles, setSubtitles] = useState<Record<ProductGroup, string>>({ alumni: "", family: "", guest: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data, error: rpcError } = await (supabase as any).rpc("admin_get_ticket_lots", {
        p_event_id: DEFAULT_EVENT_ID,
      });
      if (rpcError) throw rpcError;
      const nextProducts = Array.isArray((data as AdminLotsPayload | null)?.products)
        ? ((data as AdminLotsPayload).products ?? [])
        : [];
      setProducts(nextProducts);

      const next = { alumni: "", family: "", guest: "" } as Record<ProductGroup, string>;
      GROUPS.forEach(group => {
        const matching = nextProducts.filter(product => groupForProduct(product.product_code, product.name) === group.id);
        next[group.id] = matching.map(product => product.description?.trim() ?? "").find(Boolean) || group.fallback;
      });
      setSubtitles(next);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      for (const group of GROUPS) {
        const ids = products
          .filter(product => groupForProduct(product.product_code, product.name) === group.id)
          .map(product => product.id);
        if (!ids.length) continue;
        const { error: updateError } = await (supabase as any)
          .from("ticket_types")
          .update({ description: subtitles[group.id].trim() })
          .in("id", ids);
        if (updateError) throw updateError;
      }
      setSuccess("Subtítulos salvos. Os cards públicos foram atualizados.");
      window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar os subtítulos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section data-admin-ticket-product-copy="true" className="border border-[#2d6a4f]/25 bg-[#141f14] p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#c9a84c]">Textos dos cards</p>
          <h2 className="mt-2 font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0]">Subtítulos dos ingressos</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#7a9a7a]">Os textos abaixo aparecem logo abaixo do nome dos três cards públicos na Home e em /ingressos.</p>
        </div>
        <button type="button" onClick={() => void save()} disabled={loading || saving} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c9a84c] px-5 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#0d1a0f] disabled:opacity-40">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}{saving ? "Salvando..." : "Salvar subtítulos"}
        </button>
      </div>

      {error && <div role="alert" className="mb-4 flex items-start gap-3 border border-[#c0392b]/45 bg-[#c0392b]/10 p-4 text-sm text-[#f0ebe0]"><AlertCircle size={18} className="mt-0.5 shrink-0 text-[#e74c3c]" />{error}</div>}
      {success && <div role="status" className="mb-4 flex items-start gap-3 border border-[#2d6a4f]/45 bg-[#2d6a4f]/10 p-4 text-sm text-[#74c69d]"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{success}</div>}

      {loading ? (
        <div className="flex min-h-32 items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider text-[#7a9a7a]"><RefreshCw size={18} className="animate-spin" />Carregando subtítulos...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {GROUPS.map(group => (
            <label key={group.id} className="block">
              <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#7a9a7a]">{group.label}</span>
              <textarea rows={4} value={subtitles[group.id]} onChange={event => setSubtitles(current => ({ ...current, [group.id]: event.target.value }))} className="w-full resize-y border border-[#2d6a4f]/30 bg-[#1a2e1a] px-4 py-3 text-sm leading-relaxed text-[#f0ebe0] outline-none transition-colors focus:border-[#c9a84c]" />
            </label>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminTicketProductCopyMount() {
  const [routeVersion, setRouteVersion] = useState(0);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const active = useMemo(() => isLotsRoute(), [routeVersion]);

  useEffect(() => {
    const onRouteChange = () => setRouteVersion(version => version + 1);
    window.addEventListener("popstate", onRouteChange);
    window.addEventListener("pushstate", onRouteChange);
    return () => {
      window.removeEventListener("popstate", onRouteChange);
      window.removeEventListener("pushstate", onRouteChange);
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setMountNode(null);
      return;
    }

    let container = document.querySelector<HTMLElement>("[data-admin-ticket-product-copy-container]");

    const ensureMount = () => {
      const panel = findLotsPanel();
      if (!panel || container?.isConnected) return;
      container = document.createElement("div");
      container.setAttribute("data-admin-ticket-product-copy-container", "true");
      const intro = panel.firstElementChild;
      if (intro?.nextSibling) panel.insertBefore(container, intro.nextSibling);
      else panel.appendChild(container);
      setMountNode(container);
    };

    ensureMount();
    const observer = new MutationObserver(ensureMount);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      container?.remove();
    };
  }, [active]);

  if (!active || !mountNode) return null;
  return createPortal(<ProductCopyPanel />, mountNode);
}
