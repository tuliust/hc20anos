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
