import type { Database } from "./database.generated";

export type ClaimStatus = Database["public"]["Enums"]["claim_status"];
export type DisputeStatus = Database["public"]["Enums"]["dispute_status"];

export type DbProfileClaim = Database["public"]["Tables"]["profile_claims"]["Row"];
export type DbProfileClaimAnswer = Database["public"]["Tables"]["profile_claim_answers"]["Row"];
export type DbProfileClaimDispute = Database["public"]["Tables"]["profile_claim_disputes"]["Row"];
