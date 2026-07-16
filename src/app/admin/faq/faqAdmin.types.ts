import type { DbFaqCategory, DbFaqItem } from "../../../lib/database.types";

export type AdminFaqView = "questions" | "categories" | "trash";
export type AdminFaqNotice = (message: string, type?: "success" | "error" | "info") => void;

export interface FaqItemFormValue {
  question: string;
  answer: string;
  category_id: string;
  slug?: string;
  sort_order: number;
  is_visible: boolean;
  is_featured: boolean;
}

export interface FaqCategoryFormValue {
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_visible: boolean;
}

export interface FaqModalBaseProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
}

export type EditableFaqItem = DbFaqItem | null;
export type EditableFaqCategory = DbFaqCategory | null;
