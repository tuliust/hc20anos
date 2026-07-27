import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { AdminRole } from "../lib/admin.types";
import { OperationsPage } from "./OperationsPage";
import { OperationsReportingPanel } from "./OperationsReportingPanel";

const OPERATION_ROLES = new Set<AdminRole>(["superadmin", "admin", "checkin_staff"]);

export function OperationsRouteGuard() {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let active = true;

    async function authorize() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!active) return;

      if (!session) {
        window.location.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!active) return;
      const resolvedRole = data?.role as AdminRole | undefined;
      if (error || !resolvedRole || !OPERATION_ROLES.has(resolvedRole)) {
        setDenied(true);
        setLoading(false);
        return;
      }

      setRole(resolvedRole);
      setLoading(false);
    }

    void authorize();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <main className="operations-page"><div className="operations-empty">Validando acesso operacional...</div></main>;
  }

  if (denied || !role) {
    return <main className="operations-page">
      <div className="operations-empty">
        <h1>Acesso não autorizado</h1>
        <p>Esta área exige perfil administrativo ou operacional.</p>
        <button type="button" onClick={() => window.location.assign("/")}>Voltar ao site</button>
      </div>
    </main>;
  }

  const canViewFinancialOperations = role === "admin" || role === "superadmin";

  return <>
    <OperationsPage role={role} />
    {canViewFinancialOperations && <OperationsReportingPanel />}
  </>;
}
