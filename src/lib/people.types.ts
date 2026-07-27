import type { Database } from "./database.generated";

type PersonRow = Database["public"]["Tables"]["people"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type PublicLocationViewRow = Database["public"]["Views"]["public_profile_locations"]["Row"];
type PublicProfileCardViewRow = Database["public"]["Views"]["public_profile_cards"]["Row"];
type AlumniDirectoryStatusViewRow = Database["public"]["Views"]["public_alumni_directory_status"]["Row"];
type CuriosityProfileStatsViewRow = Database["public"]["Views"]["public_curiosity_profile_stats"]["Row"];
type SchoolQuestionnaireOptionStatViewRow = Database["public"]["Views"]["public_school_questionnaire_option_stats"]["Row"];

export type ProfileStatus = Database["public"]["Enums"]["profile_status"];

// O schema mantém estes campos como `text`; a aplicação restringe os valores
// aceitos pelos formulários e componentes a estes conjuntos de domínio.
export type Gender = "male" | "female";
export type RelationshipStatus = "single" | "dating" | "married";

// Contrato de compatibilidade para a aplicação e os mocks históricos.
// Os campos opcionais existem como colunas obrigatórias anuláveis no row real,
// mas permanecem opcionais aqui até os fixtures e formulários serem normalizados.
export type DbPerson = Omit<
  PersonRow,
  | "display_name"
  | "gender"
  | "birth_year"
  | "verification_status"
  | "contact_email"
  | "contact_whatsapp"
  | "avatar_url"
> & {
  display_name?: PersonRow["display_name"];
  gender?: Gender | null;
  birth_year?: PersonRow["birth_year"];
  verification_status?: PersonRow["verification_status"];
  contact_email?: PersonRow["contact_email"];
  contact_whatsapp?: PersonRow["contact_whatsapp"];
  avatar_url?: PersonRow["avatar_url"];
};

// O row é preservado, com duas restrições de domínio já utilizadas pela UI.
export type DbProfile = Omit<ProfileRow, "relationship_status" | "intends_to_attend"> & {
  relationship_status: RelationshipStatus | null;
  intends_to_attend?: ProfileRow["intends_to_attend"];
};

export type UpsertProfile = Omit<DbProfile, "id" | "created_at" | "updated_at">;

// As views abaixo possuem campos anuláveis na inferência da Supabase CLI. As
// consultas atuais e o SQL das views garantem os identificadores usados pela UI;
// por isso estes modelos de leitura preservam as invariantes históricas.
export type PublicLocationRow = Omit<
  PublicLocationViewRow,
  "profile_id" | "person_id" | "full_name" | "current_city"
> & {
  profile_id: string;
  person_id: string;
  full_name: string;
  current_city: string;
};

export type PublicProfileCardRow = Omit<
  PublicProfileCardViewRow,
  | "profile_id"
  | "person_id"
  | "full_name"
  | "relationship_status"
  | "has_children"
  | "intends_to_attend"
> & {
  profile_id: string;
  person_id: string;
  full_name: string;
  relationship_status: RelationshipStatus | null;
  has_children: boolean;
  intends_to_attend?: boolean | null;
};

export type AlumniDirectoryStatusRow = Omit<
  AlumniDirectoryStatusViewRow,
  | "event_id"
  | "person_id"
  | "full_name"
  | "profile_status"
  | "has_approved_ticket"
  | "has_completed_registration"
  | "intends_to_attend"
> & {
  event_id: string;
  person_id: string;
  full_name: string;
  profile_status: ProfileStatus;
  has_approved_ticket: boolean;
  has_completed_registration: boolean;
  intends_to_attend: boolean;
};

export interface CuriosityCountItem {
  label: string;
  count: number;
}

// Os campos JSON da view são arrays de contagem no contrato funcional.
export interface CuriosityProfileStatsRow {
  event_id: NonNullable<CuriosityProfileStatsViewRow["event_id"]>;
  total_people: NonNullable<CuriosityProfileStatsViewRow["total_people"]>;
  total_registered: NonNullable<CuriosityProfileStatsViewRow["total_registered"]>;
  total_preconfirmed: NonNullable<CuriosityProfileStatsViewRow["total_preconfirmed"]>;
  total_confirmed: NonNullable<CuriosityProfileStatsViewRow["total_confirmed"]>;
  total_with_relationship: NonNullable<CuriosityProfileStatsViewRow["total_with_relationship"]>;
  total_with_children: NonNullable<CuriosityProfileStatsViewRow["total_with_children"]>;
  total_children_declared: NonNullable<CuriosityProfileStatsViewRow["total_children_declared"]>;
  relationship_status_counts: CuriosityCountItem[];
  children_status_counts: CuriosityCountItem[];
  children_count_distribution: CuriosityCountItem[];
  profession_area_counts: CuriosityCountItem[];
}

export type SchoolQuestionnaireOptionStatRow = Omit<
  SchoolQuestionnaireOptionStatViewRow,
  "event_id" | "question_id" | "option_label" | "answer_count"
> & {
  event_id: string;
  question_id: string;
  option_label: string;
  answer_count: number;
};

export interface LocationStat {
  key: string;
  city: string;
  state: string | null;
  country: string | null;
  count: number;
  people: PublicLocationRow[];
}
