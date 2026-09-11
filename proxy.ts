import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Session-refresh only — no route redirects here. Route protection lives in
// app/admin/layout.tsx (and account/layout.tsx once it exists), matching the
// project's stated architecture: "Middleware это удобство, реальная защита
// в layout и в RLS" (gastromania-tasks.md, Блок 3).
//
// Why this exists at all: lib/supabase/server.ts's `setAll` silently no-ops
// when called from a Server Component render (cookies can't be written
// there — see the comment in that file). Supabase issues a *rotating*
// refresh token, so if a refreshed session is never persisted back to
// cookies, the next refresh attempt reuses an already-consumed token and the
// user gets silently logged out. Running the refresh here, in a context that
// can write response cookies on every request, is the standard Supabase/
// Next.js fix.
//
// Renamed from `middleware.ts` to `proxy.ts` in Next.js 16 — see
// node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
//
// Also forwards the requested path as `x-pathname` — Server Component
// layouts (app/admin/layout.tsx) have no other way to know which nested
// page triggered them, and need it to send an unauthenticated visitor to
// `/login?next=<the page they actually wanted>` instead of always `/admin`.
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Touching the session is what triggers the refresh-if-expired logic.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
