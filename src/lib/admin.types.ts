import type { Database } from "./database.generated";

export type AdminRole = Database["public"]["Enums"]["admin_role"];
export type DbAdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
