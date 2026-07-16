import { useEffect, useState } from "react";
import type { DbFaqCategory, DbFaqItem } from "../../lib/database.types";
import { getPublicFaqCategories, getPublicFaqItems } from "../../lib/faq";
import { HomeFaqSection, type HomeFaqSectionProps } from "./HomeFaqSection";

interface HomeFaqSectionLoaderProps extends Omit<HomeFaqSectionProps, "categories" | "items"> {
  eventId: string;
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
      setCategories(nextCategories);
      setItems(nextItems);
    }).catch(() => {
      if (!active) return;
      setCategories([]);
      setItems([]);
    });
    return () => { active = false; };
  }, [props.eventId]);

  return <HomeFaqSection {...props} categories={categories} items={items} />;
}
