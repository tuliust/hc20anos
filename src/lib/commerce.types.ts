import type { Database } from "./database.generated";

type TicketTypeRow = Database["public"]["Tables"]["ticket_types"]["Row"];

// Status financeiro proveniente diretamente do enum reproduzido do banco.
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

// Projeção de domínio usada pelo catálogo público e pela seleção inicial do
// checkout. Mantém os campos históricos obrigatórios e aceita, de forma
// opcional, os metadados comerciais adicionados ao row atual.
//
// `publicTicketCatalog.ts` e `SecureCheckoutPage.tsx` usam esta projeção.
// Não usar este tipo como substituto do row completo em operações de escrita.
export type DbTicketType = Pick<
  TicketTypeRow,
  | "id"
  | "event_id"
  | "name"
  | "description"
  | "price_cents"
  | "available_quantity"
  | "sold_quantity"
  | "sales_start_at"
  | "sales_end_at"
  | "allows_guest"
  | "status"
  | "created_at"
  | "updated_at"
> & Partial<Pick<
  TicketTypeRow,
  | "product_code"
  | "included_people_count"
  | "metadata_json"
  | "package_kind"
  | "participant_type"
>>;
