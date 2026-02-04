import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get auth session from cookie or header
  const authCookie = request.cookies.get("caveris_auth");
  const isAuthenticated = authCookie?.value ? true : false;

  const { pathname } = request.nextUrl;

  // Protect dashboard routes - redirect to login if not authenticated
  if (
    !isAuthenticated &&
    (pathname.startsWith("/admin") ||
      pathname.startsWith("/manager") ||
      pathname.startsWith("/verifier") ||
      pathname.startsWith("/super-admin"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // DON'T auto-redirect from login page - let the login page handle it
  // This prevents redirect loops

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).*)",
  ],
};
