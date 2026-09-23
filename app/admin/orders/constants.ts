// Отдельный файл, а не actions.ts — из модуля с "use server" можно
// экспортировать только async-функции, константы там запрещены (тот же
// приём уже применён в app/admin/menu/constants.ts).

// Состав заказа редактируется только пока кухня к нему не приступила.
// Для preparing/ready/out_for_delivery/delivered/cancelled обычный UI
// правку не предлагает — тот же список продублирован жёстким гейтом
// внутри admin_update_order_items() (20260919100000).
export const EDITABLE_ORDER_STATUSES = ["new", "accepted"] as const;

export function isOrderEditable(orderStatus: string): boolean {
  return (EDITABLE_ORDER_STATUSES as readonly string[]).includes(orderStatus);
}

export const REASON_CODES = [
  { value: "item_unavailable", label: "Позиции нет в наличии" },
  { value: "customer_requested_swap", label: "Замена по просьбе клиента" },
  { value: "quantity_change", label: "Изменение количества" },
  { value: "other", label: "Другое" },
] as const;

export const REASON_LABELS: Record<string, string> = Object.fromEntries(
  REASON_CODES.map((r) => [r.value, r.label])
);
