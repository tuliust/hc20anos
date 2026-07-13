import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import CmsAdminPanels from "./CmsAdminPanels";

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

export function AdminCmsPanelsMount() {
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname));
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    function syncPathname() {
      setPathname(normalizePathname(window.location.pathname));
    }

    window.addEventListener("popstate", syncPathname);
    window.addEventListener("pushstate", syncPathname as EventListener);
    window.addEventListener("replacestate", syncPathname as EventListener);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function patchedPushState(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("pushstate"));
      return result;
    };

    window.history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("replacestate"));
      return result;
    };

    return () => {
      window.removeEventListener("popstate", syncPathname);
      window.removeEventListener("pushstate", syncPathname as EventListener);
      window.removeEventListener("replacestate", syncPathname as EventListener);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    }).catch(() => {
      if (active) setUserId(null);
    });
    return () => { active = false; };
  }, [pathname]);

  if (pathname !== "/admin") return null;

  return (
    <div className="bg-[#080f08] px-4 pb-20">
      <div className="max-w-7xl mx-auto">
        <CmsAdminPanels adminId={userId} canManageEvent />
      </div>
    </div>
  );
}
