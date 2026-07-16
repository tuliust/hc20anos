import type { DbFaqCategory, DbFaqItem } from "./database.types";
import { supabase } from "./supabase";
import { writeAudit } from "./services";

export const DEFAULT_FAQ_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export type FaqVisibilityFilter = "all" | "visible" | "hidden";
export type FaqFeaturedFilter = "all" | "featured" | "regular";
export type FaqDeletedFilter = "active" | "deleted" | "all";
export type FaqSort = "page-order" | "newest" | "alphabetical";

export interface AdminFaqFilters {
  search?: string;
  categoryId?: string;
  visibility?: FaqVisibilityFilter;
  featured?: FaqFeaturedFilter;
  deleted?: FaqDeletedFilter;
  sort?: FaqSort;
}

export interface AdminFaqCategoryOptions {
  deleted?: FaqDeletedFilter;
}

export interface CreateFaqCategoryInput {
  event_id: string;
  key: string;
  label: string;
  description?: string | null;
  sort_order: number;
  is_visible?: boolean;
  admin_id?: string | null;
}

export type FaqCategoryPatch = Partial<Pick<
  DbFaqCategory,
  "key" | "label" | "description" | "sort_order" | "is_visible"
>>;

export interface CreateFaqItemInput {
  event_id: string;
  category_id: string;
  question: string;
  answer: string;
  slug?: string;
  sort_order: number;
  is_visible?: boolean;
  is_featured?: boolean;
  admin_id?: string | null;
}

export type FaqItemPatch = Partial<Pick<
  DbFaqItem,
  "question" | "answer" | "category_id" | "sort_order" | "is_visible" | "is_featured"
>>;

export interface FaqOrderInput {
  id: string;
  sort_order: number;
}

export interface PublicFaqData {
  categories: DbFaqCategory[];
  items: DbFaqItem[];
  source: "structured" | "legacy-json";
}

interface LegacyFaqItem {
  q?: unknown;
  a?: unknown;
  is_visible?: unknown;
}

export class FaqCategoryNotEmptyError extends Error {
  readonly itemCount: number;

  constructor(itemCount: number) {
    super(`A categoria possui ${itemCount} pergunta(s) ativa(s). Mova ou apague essas perguntas antes.`);
    this.name = "FaqCategoryNotEmptyError";
    this.itemCount = itemCount;
  }
}

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function slugifyFaqText(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} é obrigatório.`);
}

function assertSortOrder(value: number) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error("A ordem deve ser um número inteiro não negativo.");
  }
}

function isMissingFaqRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01"
    || error.code === "PGRST205"
    || Boolean(error.message?.includes("faq_items") && error.message?.includes("schema cache"));
}

function mapFaqError(error: { code?: string; message?: string }): Error {
  if (error.code === "23505") return new Error("Já existe um registro de FAQ com esta chave ou slug.");
  if (error.message?.includes("FAQ_CATEGORY_HAS_ACTIVE_ITEMS:")) {
    const count = Number(error.message.split("FAQ_CATEGORY_HAS_ACTIVE_ITEMS:")[1]?.match(/^\d+/)?.[0] ?? 0);
    return new FaqCategoryNotEmptyError(count);
  }
  return new Error(error.message || "Não foi possível atualizar o FAQ.");
}

function sortCategories(categories: DbFaqCategory[]): DbFaqCategory[] {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, "pt-BR"));
}

function sortItemsByPageOrder(items: DbFaqItem[]): DbFaqItem[] {
  return [...items].sort((a, b) => {
    const categoryOrder = (a.category?.sort_order ?? 0) - (b.category?.sort_order ?? 0);
    if (categoryOrder !== 0) return categoryOrder;
    return a.sort_order - b.sort_order || a.question.localeCompare(b.question, "pt-BR");
  });
}

export async function getPublicFaqCategories(eventId: string): Promise<DbFaqCategory[]> {
  const { data, error } = await supabase
    .from("faq_categories")
    .select("*")
    .eq("event_id", eventId)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (isMissingFaqRelation(error)) return [];
  if (error) throw error;
  return sortCategories((data ?? []) as DbFaqCategory[]);
}

async function getLegacyFaqItems(eventId: string, categories: DbFaqCategory[] = []): Promise<DbFaqItem[]> {
  const { data, error } = await supabase
    .from("home_page_content")
    .select("faq_items_json")
    .eq("event_id", eventId)
    .maybeSingle();

  if (error) throw error;

  let parsed: LegacyFaqItem[] = [];
  try {
    const value = JSON.parse(data?.faq_items_json || "[]");
    parsed = Array.isArray(value) ? value : [];
  } catch {
    parsed = [];
  }

  const category = categories.find(item => item.key === "general") ?? null;
  const now = new Date(0).toISOString();

  return parsed.flatMap((item, index) => {
    const question = typeof item.q === "string" ? item.q.trim() : "";
    const answer = typeof item.a === "string" ? item.a.trim() : "";
    if (!question || !answer || item.is_visible === false) return [];
    const baseSlug = slugifyFaqText(question) || `item-${index + 1}`;
    return [{
      id: `legacy-${index}-${baseSlug}`,
      event_id: eventId,
      category_id: category?.id ?? "legacy-general",
      slug: `legacy-${baseSlug}`,
      question,
      answer,
      sort_order: index * 10,
      is_visible: true,
      is_featured: true,
      created_at: now,
      updated_at: now,
      created_by_admin_id: null,
      updated_by_admin_id: null,
      deleted_at: null,
      deleted_by_admin_id: null,
      category,
    } satisfies DbFaqItem];
  });
}

async function queryPublicFaqItems(eventId: string): Promise<DbFaqItem[] | null> {
  const { data, error } = await (supabase as any)
    .from("faq_items")
    .select("*, category:faq_categories!inner(*)")
    .eq("event_id", eventId)
    .eq("is_visible", true)
    .is("deleted_at", null)
    .eq("category.is_visible", true)
    .is("category.deleted_at", null);

  if (isMissingFaqRelation(error)) return null;
  if (error) throw error;
  return sortItemsByPageOrder((data ?? []) as DbFaqItem[]);
}

async function hasStructuredFaqItems(eventId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_structured_faq_items", { p_event_id: eventId });
  if (isMissingFaqRelation(error) || error?.code === "PGRST202") return false;
  if (error) throw error;
  return Boolean(data);
}

export async function getPublicFaqItems(eventId: string): Promise<DbFaqItem[]> {
  const structured = await queryPublicFaqItems(eventId);
  if (structured?.length) return structured;
  if (structured && await hasStructuredFaqItems(eventId)) return [];
  const categories = await getPublicFaqCategories(eventId);
  return getLegacyFaqItems(eventId, categories);
}

export async function getPublicFaqData(eventId: string): Promise<PublicFaqData> {
  const categories = await getPublicFaqCategories(eventId);
  const structured = await queryPublicFaqItems(eventId);
  if (structured?.length) return { categories, items: structured, source: "structured" };
  if (structured && await hasStructuredFaqItems(eventId)) {
    return { categories, items: [], source: "structured" };
  }
  return {
    categories,
    items: await getLegacyFaqItems(eventId, categories),
    source: "legacy-json",
  };
}

export async function getAdminFaqCategories(
  eventId: string,
  options: AdminFaqCategoryOptions = {},
): Promise<DbFaqCategory[]> {
  let query = supabase.from("faq_categories").select("*").eq("event_id", eventId);
  const deleted = options.deleted ?? "active";
  if (deleted === "active") query = query.is("deleted_at", null);
  if (deleted === "deleted") query = query.not("deleted_at", "is", null);
  const { data, error } = await query.order("sort_order", { ascending: true });
  if (error) throw error;
  return sortCategories((data ?? []) as DbFaqCategory[]);
}

export async function getAdminFaqItems(
  eventId: string,
  filters: AdminFaqFilters = {},
): Promise<DbFaqItem[]> {
  let query = (supabase as any)
    .from("faq_items")
    .select("*, category:faq_categories(*)")
    .eq("event_id", eventId);

  const deleted = filters.deleted ?? "active";
  if (deleted === "active") query = query.is("deleted_at", null);
  if (deleted === "deleted") query = query.not("deleted_at", "is", null);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.visibility === "visible") query = query.eq("is_visible", true);
  if (filters.visibility === "hidden") query = query.eq("is_visible", false);
  if (filters.featured === "featured") query = query.eq("is_featured", true);
  if (filters.featured === "regular") query = query.eq("is_featured", false);

  const { data, error } = await query;
  if (error) throw error;
  let items = (data ?? []) as DbFaqItem[];

  const search = normalizeText(filters.search ?? "");
  if (search) {
    items = items.filter(item => normalizeText([
      item.question,
      item.answer,
      item.slug,
      item.category?.label ?? "",
    ].join(" ")).includes(search));
  }

  if (filters.sort === "newest") {
    return [...items].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  }
  if (filters.sort === "alphabetical") {
    return [...items].sort((a, b) => a.question.localeCompare(b.question, "pt-BR"));
  }
  return sortItemsByPageOrder(items);
}

export async function createFaqCategory(input: CreateFaqCategoryInput): Promise<DbFaqCategory> {
  assertNonEmpty(input.key, "A chave");
  assertNonEmpty(input.label, "O nome");
  assertSortOrder(input.sort_order);
  const key = slugifyFaqText(input.key);
  if (!key) throw new Error("A chave da categoria é inválida.");

  const { data, error } = await supabase.from("faq_categories").insert({
    event_id: input.event_id,
    key,
    label: input.label.trim(),
    description: input.description?.trim() || null,
    sort_order: input.sort_order,
    is_visible: input.is_visible ?? true,
    created_by_admin_id: input.admin_id ?? null,
    updated_by_admin_id: input.admin_id ?? null,
  }).select("*").single();
  if (error) throw mapFaqError(error);
  await writeAudit("create_faq_category", "faq_categories", data.id, { event_id: input.event_id });
  return data as DbFaqCategory;
}

export async function updateFaqCategory(
  id: string,
  patch: FaqCategoryPatch,
  adminId: string,
): Promise<DbFaqCategory> {
  if (patch.key !== undefined) {
    assertNonEmpty(patch.key, "A chave");
    patch = { ...patch, key: slugifyFaqText(patch.key) };
  }
  if (patch.label !== undefined) assertNonEmpty(patch.label, "O nome");
  if (patch.sort_order !== undefined) assertSortOrder(patch.sort_order);
  const payload = { ...patch, updated_by_admin_id: adminId };
  const { data, error } = await supabase.from("faq_categories").update(payload).eq("id", id).select("*").single();
  if (error) throw mapFaqError(error);
  await writeAudit("update_faq_category", "faq_categories", id, { patch });
  return data as DbFaqCategory;
}

export function setFaqCategoryVisibility(id: string, visible: boolean, adminId: string) {
  return updateFaqCategory(id, { is_visible: visible }, adminId).then(async category => {
    await writeAudit(visible ? "show_faq_category" : "hide_faq_category", "faq_categories", id);
    return category;
  });
}

export async function softDeleteFaqCategory(id: string, adminId: string): Promise<DbFaqCategory> {
  const { count, error: countError } = await supabase
    .from("faq_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id)
    .is("deleted_at", null);
  if (countError) throw countError;
  if ((count ?? 0) > 0) throw new FaqCategoryNotEmptyError(count ?? 0);

  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase.from("faq_categories").update({
    deleted_at: deletedAt,
    deleted_by_admin_id: adminId,
    updated_by_admin_id: adminId,
  }).eq("id", id).select("*").single();
  if (error) throw mapFaqError(error);
  await writeAudit("soft_delete_faq_category", "faq_categories", id, { deleted_at: deletedAt });
  return data as DbFaqCategory;
}

export async function restoreFaqCategory(id: string, adminId: string): Promise<DbFaqCategory> {
  const { data, error } = await supabase.from("faq_categories").update({
    deleted_at: null,
    deleted_by_admin_id: null,
    updated_by_admin_id: adminId,
  }).eq("id", id).select("*").single();
  if (error) throw mapFaqError(error);
  await writeAudit("restore_faq_category", "faq_categories", id);
  return data as DbFaqCategory;
}

export async function permanentlyDeleteFaqCategory(id: string): Promise<void> {
  const { error } = await supabase.from("faq_categories").delete().eq("id", id).not("deleted_at", "is", null);
  if (error) throw mapFaqError(error);
  await writeAudit("permanently_delete_faq_category", "faq_categories", id);
}

async function createUniqueFaqSlug(eventId: string, question: string): Promise<string> {
  const base = slugifyFaqText(question) || "pergunta";
  const { data, error } = await supabase
    .from("faq_items")
    .select("slug")
    .eq("event_id", eventId)
    .like("slug", `${base}%`);
  if (error) throw error;
  const existing = new Set((data ?? []).map(item => item.slug));
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export async function createFaqItem(input: CreateFaqItemInput): Promise<DbFaqItem> {
  assertNonEmpty(input.question, "A pergunta");
  assertNonEmpty(input.answer, "A resposta");
  assertSortOrder(input.sort_order);
  const slug = input.slug ? slugifyFaqText(input.slug) : await createUniqueFaqSlug(input.event_id, input.question);
  if (!slug) throw new Error("O slug é inválido.");

  const { data, error } = await supabase.from("faq_items").insert({
    event_id: input.event_id,
    category_id: input.category_id,
    slug,
    question: input.question.trim(),
    answer: input.answer.trim(),
    sort_order: input.sort_order,
    is_visible: input.is_visible ?? true,
    is_featured: input.is_featured ?? false,
    created_by_admin_id: input.admin_id ?? null,
    updated_by_admin_id: input.admin_id ?? null,
  }).select("*, category:faq_categories(*)").single();
  if (error) throw mapFaqError(error);
  await writeAudit("create_faq_item", "faq_items", data.id, { category_id: input.category_id });
  return data as unknown as DbFaqItem;
}

export async function updateFaqItem(id: string, patch: FaqItemPatch, adminId: string): Promise<DbFaqItem> {
  if (patch.question !== undefined) assertNonEmpty(patch.question, "A pergunta");
  if (patch.answer !== undefined) assertNonEmpty(patch.answer, "A resposta");
  if (patch.sort_order !== undefined) assertSortOrder(patch.sort_order);
  const { data, error } = await supabase.from("faq_items").update({
    ...patch,
    updated_by_admin_id: adminId,
  }).eq("id", id).select("*, category:faq_categories(*)").single();
  if (error) throw mapFaqError(error);
  await writeAudit("update_faq_item", "faq_items", id, { patch });
  return data as unknown as DbFaqItem;
}

export function setFaqItemVisibility(id: string, visible: boolean, adminId: string) {
  return updateFaqItem(id, { is_visible: visible }, adminId).then(async item => {
    await writeAudit(visible ? "show_faq_item" : "hide_faq_item", "faq_items", id);
    return item;
  });
}

export function setFaqItemFeatured(id: string, featured: boolean, adminId: string) {
  return updateFaqItem(id, { is_featured: featured }, adminId).then(async item => {
    await writeAudit(featured ? "feature_faq_item" : "unfeature_faq_item", "faq_items", id);
    return item;
  });
}

export function moveFaqItem(id: string, categoryId: string, sortOrder: number, adminId: string) {
  assertSortOrder(sortOrder);
  return updateFaqItem(id, { category_id: categoryId, sort_order: sortOrder }, adminId).then(async item => {
    await writeAudit("move_faq_item", "faq_items", id, { category_id: categoryId, sort_order: sortOrder });
    return item;
  });
}

export async function softDeleteFaqItem(id: string, adminId: string): Promise<DbFaqItem> {
  const deletedAt = new Date().toISOString();
  const { data, error } = await supabase.from("faq_items").update({
    deleted_at: deletedAt,
    deleted_by_admin_id: adminId,
    updated_by_admin_id: adminId,
  }).eq("id", id).select("*, category:faq_categories(*)").single();
  if (error) throw mapFaqError(error);
  await writeAudit("soft_delete_faq_item", "faq_items", id, { deleted_at: deletedAt });
  return data as unknown as DbFaqItem;
}

export async function restoreFaqItem(id: string, adminId: string): Promise<DbFaqItem> {
  const { data: current, error: currentError } = await (supabase as any)
    .from("faq_items")
    .select("category:faq_categories!inner(id, deleted_at)")
    .eq("id", id)
    .single();
  if (currentError) throw currentError;
  if (current?.category?.deleted_at) {
    throw new Error("Restaure a categoria ou mova a pergunta antes de restaurá-la.");
  }

  const { data, error } = await supabase.from("faq_items").update({
    deleted_at: null,
    deleted_by_admin_id: null,
    updated_by_admin_id: adminId,
  }).eq("id", id).select("*, category:faq_categories(*)").single();
  if (error) throw mapFaqError(error);
  await writeAudit("restore_faq_item", "faq_items", id);
  return data as unknown as DbFaqItem;
}

export async function permanentlyDeleteFaqItem(id: string): Promise<void> {
  const { error } = await supabase.from("faq_items").delete().eq("id", id).not("deleted_at", "is", null);
  if (error) throw mapFaqError(error);
  await writeAudit("permanently_delete_faq_item", "faq_items", id);
}

export async function reorderFaqItems(
  categoryId: string,
  items: FaqOrderInput[],
  adminId: string,
): Promise<void> {
  items.forEach(item => assertSortOrder(item.sort_order));
  const { data: category, error: categoryError } = await supabase
    .from("faq_categories")
    .select("event_id")
    .eq("id", categoryId)
    .single();
  if (categoryError) throw categoryError;
  const { error } = await supabase.rpc("reorder_faq_items", {
    p_event_id: category.event_id,
    p_category_id: categoryId,
    p_items: items,
    p_admin_id: adminId,
  });
  if (error) throw mapFaqError(error);
  await writeAudit("reorder_faq_items", "faq_categories", categoryId, { items });
}

export async function reorderFaqCategories(
  eventId: string,
  categories: FaqOrderInput[],
  adminId: string,
): Promise<void> {
  categories.forEach(category => assertSortOrder(category.sort_order));
  const { error } = await supabase.rpc("reorder_faq_categories", {
    p_event_id: eventId,
    p_categories: categories,
    p_admin_id: adminId,
  });
  if (error) throw mapFaqError(error);
  await writeAudit("reorder_faq_categories", "events", eventId, { categories });
}

export async function moveFaqCategoryItems(
  sourceCategoryId: string,
  targetCategoryId: string,
  adminId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("move_faq_category_items", {
    p_source_category_id: sourceCategoryId,
    p_target_category_id: targetCategoryId,
    p_admin_id: adminId,
  });
  if (error) throw mapFaqError(error);
  const moved = Number(data ?? 0);
  await writeAudit("move_faq_category_items", "faq_categories", sourceCategoryId, {
    target_category_id: targetCategoryId,
    moved,
  });
  return moved;
}
