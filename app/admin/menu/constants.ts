// Категория описывает, ЧТО это за блюдо. Возим ли мы его — отдельный флаг
// menu_items.available_for_delivery (20260923100000), а не категория.
//
// 'delivery' здесь остаётся только ради уже существующих блюд, которым эту
// категорию проставили, когда она работала техническим флагом: убрать
// значение из списка — значит сломать их редактирование (validate() в
// actions.ts отверг бы неизвестную категорию). Для новых блюд выбирать её
// незачем, поэтому подпись явно помечена как устаревшая.
//
// Реальный список категорий («узбекский», «десерты» и т.д.) ждёт решения
// владельца — придумывать их за него нельзя, см. gastromania-tasks.md.
export const MENU_CATEGORIES = [
  { value: "signature", label: "Фирменные блюда" },
  { value: "business_lunch", label: "Бизнес-ланч" },
  { value: "banquet", label: "Банкет" },
  { value: "delivery", label: "Доставка (старая категория)" },
] as const;

export type MenuCategory = (typeof MENU_CATEGORIES)[number]["value"];

export function categoryLabel(value: string): string {
  return MENU_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
