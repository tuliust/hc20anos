import type { AdminRole } from "../lib/admin.types";

export type Page =
  | "home" | "event" | "tickets" | "checkout" | "confirmation"
  | "who-going" | "the-class" | "ex-alumni" | "claim-profile"
  | "photo-wall" | "photo-detail" | "alumni-area"
  | "edit-profile" | "admin" | "checkin"
  | "login" | "terms" | "privacy" | "memories"
  | "curiosities" | "polls" | "where-now" | "share-invite"
  | "my-ticket" | "archive";

export interface AuthState {
  loggedIn: boolean;
  isAdmin: boolean;
  name: string;
  userId: string;
  email?: string;
  role?: AdminRole | null;
}
