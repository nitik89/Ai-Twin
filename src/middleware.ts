import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname === "/login";
  const isOnOnboardingPage = req.nextUrl.pathname === "/onboarding";
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  if (isApiRoute) return NextResponse.next();

  if (isOnLoginPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isOnOnboardingPage) return NextResponse.next();

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
