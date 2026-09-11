// Mirrors the category comment on public.menu_items in
// gastromania-spec.md (Этап 3): 'signature' | 'business_lunch' | 'banquet' |
// 'delivery'. Fixed set, not free text — a typo here would silently drop an
// item from every category-filtered query on the public site (Блок 4).
export const MENU_CATEGORIES = [
  { value: "signature", label: "Фирменные блюда" },
  { value: "business_lunch", label: "Бизнес-ланч" },
  { value: "banquet", label: "Банкет" },
  { value: "delivery", label: "Доставка" },
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number]["value"];

export function categoryLabel(value: string): string {
  return MENU_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
