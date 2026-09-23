// Человекочитаемые статусы для личного кабинета. Отдельный файл, а не
// actions.ts — из модуля с "use server" можно экспортировать только
// async-функции.

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  accepted: "Принят рестораном",
  preparing: "Готовится",
  ready: "Готов",
  out_for_delivery: "В пути",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Ошибка оплаты",
  refunded: "Возврат",
  cancelled: "Оплата отменена",
};

// Заказ «в работе» — от оформления до доставки. Всё остальное
// (delivered/cancelled) уже история.
export const ACTIVE_ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
] as const;

export function isActiveOrder(orderStatus: string): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly string[]).includes(orderStatus);
}

export function orderStatusLabel(value: string): string {
  return ORDER_STATUS_LABELS[value] ?? value;
}

export function paymentStatusLabel(value: string): string {
  return PAYMENT_STATUS_LABELS[value] ?? value;
}
