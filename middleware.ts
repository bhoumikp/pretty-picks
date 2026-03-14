import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const host = request.nextUrl.hostname;
  const url = request.nextUrl.clone();

  // Admin subdomain → rewrite to /admin
  if (host === "admin.shopprettypicks.in") {
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Prevent admin access on main domain
  if (
    (host === "shopprettypicks.in" || host === "www.shopprettypicks.in") &&
    url.pathname.startsWith("/admin")
  ) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
