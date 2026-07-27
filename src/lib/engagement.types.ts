import type { Database } from "./database.generated";
import type { ModerationStatus } from "./photo.types";

type MemoryRow = Database["public"]["Tables"]["memories"]["Row"];
type PollRow = Database["public"]["Tables"]["polls"]["Row"];
type PollResultViewRow = Database["public"]["Views"]["poll_results"]["Row"];

// As colunas de status ainda são `text` no banco; a UI trabalha com conjuntos
// fechados e mantém essas restrições no domínio.
export type PollStatus = "draft" | "open" | "closed" | "archived";

export type DbMemory = Omit<MemoryRow, "status"> & {
  status: ModerationStatus;
};

export type DbPoll = Omit<PollRow, "status"> & {
  status: PollStatus;
};

export type DbPollOption = Database["public"]["Tables"]["poll_options"]["Row"];
export type DbPollVote = Database["public"]["Tables"]["poll_votes"]["Row"];

// A view nasce de opções existentes e contagem agregada; a aplicação assume
// identificadores, texto, ordem e total presentes em cada linha retornada.
export type PollResultRow = Omit<
  PollResultViewRow,
  "poll_id" | "option_id" | "option_text" | "sort_order" | "votes_count"
> & {
  poll_id: string;
  option_id: string;
  option_text: string;
  sort_order: number;
  votes_count: number;
};
