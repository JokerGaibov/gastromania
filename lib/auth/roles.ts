import type { Database } from "@/types/database";

export type ProfileRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

// Roles allowed into /admin at this stage (Блок 3). 'waiter' and 'courier'
// exist as valid profiles.role values (see the 20260911100000 migration)
// but don't grant any access yet — they're seeded ahead of the courier/
// waiter-facing screens that don't exist until later blocks.
export const ADMIN_PANEL_ROLES = ["admin", "manager"] as const;

export function canAccessAdminPanel(role: ProfileRole | null | undefined): boolean {
  return !!role && (ADMIN_PANEL_ROLES as readonly string[]).includes(role);
}
