// Contratos de domínio do FAQ.
//
// Estes tipos preservam a forma consumida pela interface e pelas operações do
// módulo. Eles não representam rows brutos completos da Supabase:
// - `DbFaqCategory` não expõe `icon_key` diretamente; a apresentação o trata
//   como extensão opcional enquanto a estratégia editorial é revisada;
// - `DbFaqItem` usa a relação composta `category`, enquanto o row gerado também
//   possui campos desnormalizados como `category_key` e `category_label`.
//
// Não substituir por aliases da baseline sem revisar queries, fallback legado
// e componentes administrativos.
export interface DbFaqCategory {
  id: string;
  event_id: string;
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  deleted_at: string | null;
  deleted_by_admin_id: string | null;
}

export interface DbFaqItem {
  id: string;
  event_id: string;
  category_id: string;
  slug: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  deleted_at: string | null;
  deleted_by_admin_id: string | null;
  category?: DbFaqCategory | null;
}
