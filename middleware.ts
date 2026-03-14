import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname;
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Block admin routes on the main domain in production.
  if (
    process.env.NODE_ENV === "production" &&
    (host === "shopprettypicks.in" || host === "www.shopprettypicks.in") &&
    pathname.startsWith("/admin")
  ) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

  // Auth gate for admin routes (runs in all envs).
  if (isAdminRoute && !isAdminLogin) {
    return getToken({ req: request }).then((token) => {
      if (!token) {
        url.pathname = "/admin/login";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    });
  }

  if (isAdminLogin) {
    return getToken({ req: request }).then((token) => {
      if (token) {
        url.pathname = "/admin";
        url.search = "";
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    });
  }

  // Host-based routing (production only).
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  // Admin subdomain → rewrite to /admin
  if (host === "admin.shopprettypicks.in") {
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
