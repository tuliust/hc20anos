import type { Database } from "./database.generated";

// Aliases ergonômicos derivados diretamente da baseline reproduzida do banco.
// Não duplicar manualmente os valores do enum nem os campos de `admin_users`.
export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type DbAdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
