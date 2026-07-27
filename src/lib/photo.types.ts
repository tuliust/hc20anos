import type { Database } from "./database.generated";

// Alias ergonômico do row real de `photos`.
// Qualquer view model com tags, contadores ou relações deve usar outro tipo.
// Os enhancements da história importam este alias sem alterar o bundle gerado.
export type DbPhoto = Database["public"]["Tables"]["photos"]["Row"];
