import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const TICKET_PATHS = new Set(["/ingressos", "/checkout"]);
const PEOPLE_PATHS = new Set(["/ex-alunos", "/quem-vai", "/turma", "/reivindicar-perfil"]);
const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
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
