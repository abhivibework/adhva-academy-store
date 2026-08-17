import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdmin = pathname.startsWith("/admin");
  const isProtected =
    isAdmin ||
    pathname.startsWith("/orders") ||
    pathname === "/cart" ||
    pathname.startsWith("/checkout");

  if (!isProtected) {
    return NextResponse.next();
  }

  if (!req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/orders/:path*", "/cart", "/checkout", "/checkout/:path*"],
};
