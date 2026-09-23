import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";

export type PublicNavState = {
  accountHref: string;
  accountLabel: string;
  isLoggedIn: boolean;
};

// Одно место, где публичные страницы узнают состояние сессии для шапки.
// Именно server-side, а не эффектом в клиентском компоненте — иначе
// возвращается flicker «Войти → Аккаунт» (см. main.md v0.1.30).
// Вызывается на каждой публичной странице отдельно: общего layout у них
// нет, а класть это в корневой layout нельзя — под ним живёт и /admin со
// своей собственной шапкой.
export async function getPublicNavState(): Promise<PublicNavState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { accountHref: "/login", accountLabel: "Войти", isLoggedIn: false };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  return {
    accountHref: canAccessAdminPanel(profile?.role) ? "/admin" : "/account/orders",
    accountLabel: "Аккаунт",
    isLoggedIn: true,
  };
}
