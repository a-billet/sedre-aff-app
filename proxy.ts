import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";

const PUBLIC_PATHS = ["/login", "/_next", "/favicon", "/icon", "/apple-icon"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Laisser passer les ressources statiques et pages publiques
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Rafraîchir la session (important pour les tokens expirés)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rediriger vers /login si non authentifié
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = Boolean(profile?.is_super_admin);

  requestHeaders.set("x-user-email", user.email ?? "");
  requestHeaders.set("x-user-is-super-admin", isSuperAdmin ? "1" : "0");

  // Protection de la route /admin : vérifier is_super_admin
  if (pathname.startsWith("/admin")) {
    if (!isSuperAdmin) {
      // Retour à l'accueil avec un message d'erreur
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.searchParams.set("error", "access_denied");
      return NextResponse.redirect(homeUrl);
    }
  }

  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Preserve cookies potentially set by Supabase during token refresh.
  response.cookies.getAll().forEach(({ name, value, ...options }) => {
    finalResponse.cookies.set(name, value, options);
  });

  return finalResponse;
}

export const config = {
  matcher: [
    /*
     * Applique le middleware à toutes les routes sauf :
     * - _next/static (assets Next.js)
     * - _next/image (optimisation d'images)
     * - favicon.ico, icônes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
