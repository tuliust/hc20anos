import type { Database, Json } from "./database.generated";

type AuditLogRow = Database["public"]["Tables"]["audit_logs"]["Row"];
type EventArchiveSettingsRow = Database["public"]["Tables"]["event_archive_settings"]["Row"];
type HomePageContentRow = Database["public"]["Tables"]["home_page_content"]["Row"];

export type DbEvent = Database["public"]["Tables"]["events"]["Row"];

// A aplicação grava metadados de auditoria como objetos. O banco aceita `Json`
// mais amplo, mas o contrato de leitura usado pelas telas permanece objeto-chave.
export type DbAuditLog = Omit<AuditLogRow, "metadata_json"> & {
  metadata_json: Record<string, unknown>;
};

export interface ArchiveHighlightLink {
  label: string;
  url: string;
  description?: string | null;
}

export type DbEventArchiveSettings = Omit<EventArchiveSettingsRow, "highlights_links"> & {
  highlights_links: ArchiveHighlightLink[];
};

export interface EventPageGalleryItem {
  image_url: string;
  caption?: string | null;
  alt?: string | null;
}

export interface EventPageInfoItem {
  title: string;
  description: string;
}

export interface EventPageScheduleItem {
  time: string;
  title: string;
  description?: string | null;
}

// O row bruto preserva `Json` para os campos estruturados. Os adaptadores em
// `services.ts` convertem esses valores para strings editáveis ou arrays de UI.
export type DbEventPageContent = Database["public"]["Tables"]["event_page_content"]["Row"];

// Restringe apenas o modo do FAQ; os demais campos seguem a tabela gerada.
export type DbHomePageContent = Omit<HomePageContentRow, "faq_initial_mode"> & {
  faq_initial_mode: "featured" | "all" | null;
};

// Reexportação útil para adaptadores editoriais que precisem declarar JSON sem
// recorrer ao arquivo gerado diretamente.
export type EditorialJson = Json;

// `App.tsx` e `services.ts` são os consumidores centrais. Novos fluxos de CMS,
// evento, arquivo e auditoria devem importar deste módulo.
