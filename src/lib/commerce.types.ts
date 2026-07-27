import type { Database } from "./database.generated";
import type { DbPerson } from "./people.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
type TicketTypeRow = Database["public"]["Tables"]["ticket_types"]["Row"];

// Status financeiros e do catálogo provenientes dos enums reproduzidos.
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];

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

// Contrato de compatibilidade para telas e mocks históricos de pedidos. Os
// campos existentes antes da evolução do checkout permanecem obrigatórios; os
// campos atuais de reserva, idempotência, lote e detalhamento financeiro ficam
// disponíveis como opcionais até os adaptadores serem migrados integralmente.
export type DbOrder = Pick<
  OrderRow,
  | "id"
  | "event_id"
  | "buyer_name"
  | "buyer_email"
  | "buyer_phone"
  | "person_id"
  | "ticket_type_id"
  | "quantity"
  | "total_amount_cents"
  | "payment_provider"
  | "payment_provider_order_id"
  | "payment_provider_preference_id"
  | "payment_status"
  | "payment_method"
  | "paid_at"
  | "expires_at"
  | "created_at"
  | "updated_at"
> & Partial<Omit<OrderRow,
  | "id"
  | "event_id"
  | "buyer_name"
  | "buyer_email"
  | "buyer_phone"
  | "person_id"
  | "ticket_type_id"
  | "quantity"
  | "total_amount_cents"
  | "payment_provider"
  | "payment_provider_order_id"
  | "payment_provider_preference_id"
  | "payment_status"
  | "payment_method"
  | "paid_at"
  | "expires_at"
  | "created_at"
  | "updated_at"
>>;

// Mesmo princípio para ingressos: a forma histórica permanece compatível e os
// campos operacionais atuais — status, cancelamento, transferência e vouchers —
// são opcionais no domínio até que cada fluxo seja validado por E2E.
export type DbTicket = Pick<
  TicketRow,
  | "id"
  | "order_id"
  | "ticket_type_id"
  | "person_id"
  | "attendee_name"
  | "attendee_email"
  | "attendee_phone"
  | "guest_name"
  | "qr_code"
  | "qr_token_hash"
  | "checked_in"
  | "checked_in_at"
  | "checked_in_by_admin_id"
  | "created_at"
  | "updated_at"
> & Partial<Omit<TicketRow,
  | "id"
  | "order_id"
  | "ticket_type_id"
  | "person_id"
  | "attendee_name"
  | "attendee_email"
  | "attendee_phone"
  | "guest_name"
  | "qr_code"
  | "qr_token_hash"
  | "checked_in"
  | "checked_in_at"
  | "checked_in_by_admin_id"
  | "created_at"
  | "updated_at"
>>;

export type InsertOrder = Omit<DbOrder, "id" | "created_at" | "updated_at">;

export interface TicketWithDetails extends DbTicket {
  orders?: Partial<DbOrder> | null;
  ticket_types?: Partial<DbTicketType> | null;
  people?: Partial<DbPerson> | null;
}

// Todos os consumidores comerciais vigentes importam deste módulo. O mapa
// manual não deve voltar a ser usado por catálogo, checkout, pedidos ou check-in.
