import type { Database } from "./database.generated";

type PhotoCommentRow = Database["public"]["Tables"]["photo_comments"]["Row"];

// Alias ergonômico do row real de `photos`.
// Qualquer view model com tags, contadores ou relações deve usar outro tipo.
// Os enhancements da história importam este alias sem alterar o bundle gerado.
export type DbPhoto = Database["public"]["Tables"]["photos"]["Row"];
export type DbPhotoTag = Database["public"]["Tables"]["photo_tags"]["Row"];
export type DbPhotoLike = Database["public"]["Tables"]["photo_likes"]["Row"];
export type DbPhotoRemovalRequest = Database["public"]["Tables"]["photo_removal_requests"]["Row"];

// A coluna de comentários é `text` no banco. A aplicação restringe os estados
// aceitos pela interface e pelas operações de moderação a este conjunto.
export type ModerationStatus = "pending" | "approved" | "rejected" | "hidden";
export type DbPhotoComment = Omit<PhotoCommentRow, "status"> & {
  status: ModerationStatus;
};

// Agregado calculado por RPC/consulta. Não representa uma tabela ou view.
export interface PhotoStats {
  photo_id: string;
  likes_count: number;
  comments_count: number;
  is_featured?: boolean;
}
