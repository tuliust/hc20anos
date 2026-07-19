import { useEffect, useState } from "react";
import type { DbFaqCategory, DbFaqItem } from "../../lib/database.types";
import { getPublicFaqCategories, getPublicFaqItems } from "../../lib/faq";
import { HomeFaqSection, type HomeFaqSectionProps } from "./HomeFaqSection";

interface HomeFaqSectionLoaderProps extends Omit<HomeFaqSectionProps, "categories" | "items"> {
  eventId: string;
}

function normalizeFaqCategoryLabel(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function HomeFaqSectionLoader(props: HomeFaqSectionLoaderProps) {
  const [categories, setCategories] = useState<DbFaqCategory[]>([]);
  const [items, setItems] = useState<DbFaqItem[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getPublicFaqCategories(props.eventId),
      getPublicFaqItems(props.eventId),
    ]).then(([nextCategories, nextItems]) => {
      if (!active) return;

      const visibleCategories = nextCategories.filter(
        category => normalizeFaqCategoryLabel(category.label) !== "dados e privacidade",
      );
      const visibleCategoryIds = new Set(visibleCategories.map(category => category.id));

      setCategories(visibleCategories);
      setItems(nextItems.filter(item => visibleCategoryIds.has(item.category_id)));
    }).catch(() => {
      if (!active) return;
      setCategories([]);
      setItems([]);
    });
    return () => { active = false; };
  }, [props.eventId]);

  return <HomeFaqSection {...props} categories={categories} items={items} />;
}
