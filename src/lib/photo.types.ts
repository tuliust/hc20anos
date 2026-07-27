import type { Database } from "./database.generated";

// Alias ergonômico do row real de `photos`.
// Qualquer view model com tags, contadores ou relações deve usar outro tipo.
export type DbPhoto = Database["public"]["Tables"]["photos"]["Row"];
