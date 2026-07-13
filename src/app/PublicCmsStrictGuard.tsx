import { useEffect, useState } from "react";
import { getEventPageContent } from "../lib/services";
import { supabase } from "../lib/supabase";

const EVENT_PATH = "/evento";
const TICKET_PATHS = new Set(["/ingressos", "/checkout"]);
const PEOPLE_PATHS = new Set(["/ex-alunos", "/quem-vai", "/turma", "/reivindicar-perfil"]);
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

async function hasConfiguredTicketTypes() {
  const { data, error } = await supabase
    .from("ticket_types")
    .select("id")
    .eq("event_id", DEFAULT_EVENT_ID)
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

async function hasConfiguredPeople() {
  const { data, error } = await supabase
    .from("people")
    .select("id")
    .eq("is_visible", true)
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

function StrictCmsOverlay({ title, body }: { title: string; body: string }) {
  return (
    <div className="fixed inset-0 z-[95] bg-[#080f08] flex items-center justify-center px-6">
      <div className="max-w-xl border border-[#2d6a4f]/30 bg-[#141f14] p-8 text-center">
        <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-[0.2em] mb-4">CMS pendente</p>
        <h1 className="font-['Playfair_Display'] text-[#f0ebe0] text-3xl md:text-4xl font-bold leading-tight mb-4">{title}</h1>
        <p className="text-[#7a9a7a] text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export function PublicCmsStrictGuard() {
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname));
  const [eventCmsReady, setEventCmsReady] = useState<boolean | null>(null);
  const [ticketsReady, setTicketsReady] = useState<boolean | null>(null);
  const [peopleReady, setPeopleReady] = useState<boolean | null>(null);

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

  useEffect(() => {
    if (!TICKET_PATHS.has(pathname)) {
      setTicketsReady(null);
      return;
    }

    let active = true;
    setTicketsReady(null);

    hasConfiguredTicketTypes()
      .then(ready => {
        if (active) setTicketsReady(ready);
      })
      .catch(() => {
        if (active) setTicketsReady(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!PEOPLE_PATHS.has(pathname)) {
      setPeopleReady(null);
      return;
    }

    let active = true;
    setPeopleReady(null);

    hasConfiguredPeople()
      .then(ready => {
        if (active) setPeopleReady(ready);
      })
      .catch(() => {
        if (active) setPeopleReady(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  if (pathname === EVENT_PATH && eventCmsReady === false) {
    return (
      <StrictCmsOverlay
        title="Conteúdo do evento em configuração"
        body="Esta página só será exibida quando os campos obrigatórios do evento forem preenchidos no Supabase pelo painel Admin."
      />
    );
  }

  if (TICKET_PATHS.has(pathname) && ticketsReady === false) {
    return (
      <StrictCmsOverlay
        title="Ingressos em configuração"
        body="Esta página só será exibida quando houver tipos de ingresso cadastrados no Supabase para este evento."
      />
    );
  }

  if (PEOPLE_PATHS.has(pathname) && peopleReady === false) {
    return (
      <StrictCmsOverlay
        title="Base de ex-alunos em configuração"
        body="Esta página só será exibida quando houver ex-alunos visíveis cadastrados no Supabase pelo painel Admin."
      />
    );
  }

  return null;
}
