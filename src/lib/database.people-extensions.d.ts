import "./database.types";

declare module "./database.types" {
  interface DbPerson {
    birth_year: number | null;
    verification_status: "not_started" | "in_progress" | "verified" | "failed" | "manual_review" | string | null;
  }
}
