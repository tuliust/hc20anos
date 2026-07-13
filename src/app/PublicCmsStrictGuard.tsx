import { useEffect, useState } from "react";
import { getEventPageContent } from "../lib/services";

const EVENT_PATH = "/evento";
const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function isBlank(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

function hasRequiredEventCmsContent(content: Record<string, unknown>) {
  const requiredFields = [
    "hero_eyebrow",
    "title",
    "subtitle",
    "description",
    "venue_notes",
    "food_bar_text",
    "bathrooms_text",
    "security_text",
  ];

  return requiredFields.every(field => !isBlank(content[field]));
}

export function PublicCmsStrictGuard() {
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname));
  const [eventCmsReady, setEventCmsReady] = useState<boolean | null>(null);

  useEffect(() => {
    function syncPathname() {
      setPathname(normalizePathname(window.location.pathname));
    }

    window.addEventListener("popstate", syncPathname);
    window.addEventListener("pushstate", syncPathname as EventListener);
    window.addEventListener("replacestate", syncPathname as EventListener);

    return () => {
      window.removeEventListener("popstate", syncPathname);
      window.removeEventListener("pushstate", syncPathname as EventListener);
      window.removeEventListener("replacestate", syncPathname as EventListener);
    };
  }, []);

  useEffect(() => {
    if (pathname !== EVENT_PATH) {
      setEventCmsReady(null);
      return;
    }

    let active = true;
    setEventCmsReady(null);

    getEventPageContent(DEFAULT_EVENT_ID)
      .then(content => {
        if (active) setEventCmsReady(hasRequiredEventCmsContent(content as unknown as Record<string, unknown>));
      })
      .catch(() => {
        if (active) setEventCmsReady(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  if (pathname !== EVENT_PATH || eventCmsReady !== false) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">
      <div className="max-w-xl border border-[#2d6a4f]/30 bg-[#141f14] p-8 text-center">
        <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-[0.2em] mb-4">CMS pendente</p>
        <h1 className="font-['Playfair_Display'] text-[#f0ebe0] text-3xl md:text-4xl font-bold leading-tight mb-4">Conteúdo do evento em configuração</h1>
        <p className="text-[#7a9a7a] text-sm leading-relaxed">
          Esta página só será exibida quando os campos obrigatórios do evento forem preenchidos no Supabase pelo painel Admin.
        </p>
      </div>
    </div>
  );
}
