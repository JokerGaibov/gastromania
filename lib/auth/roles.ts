import type { Database } from "@/types/database";

export type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

// Финальная модель ролей: только 'admin' (весь /admin, один сотрудник
// ведёт брони/меню/акции/доставку/пользователей/будущие заказы) и
// 'customer' (обычный гость). 'manager'/'waiter'/'courier' существовали
// временно (см. 20260911100000) и были убраны обратно в
// 20260911210000_simplify_roles_to_admin_customer.sql — держать
// неиспользуемые staff-роли ради гипотетического будущего было лишним
// усложнением.
export const ADMIN_PANEL_ROLES = ["admin"] as const;

export function canAccessAdminPanel(role: ProfileRole | null | undefined): boolean {
  return !!role && (ADMIN_PANEL_ROLES as readonly string[]).includes(role);
}

// Полный набор значений, которые допускает profiles_role_check.
export const ALL_ROLES = [
  { value: "customer", label: "Гость" },
  { value: "admin", label: "Администратор" },
] as const;

export function roleLabel(role: string): string {
  return ALL_ROLES.find((r) => r.value === role)?.label ?? role;
}
