import { NextResponse } from "next/server";

export function middleware(req) {
  const session = req.cookies.get("session");

  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  if (!session || session.value !== "authenticated") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
