import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep local development lightweight; enforce auth outside dev only.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // Allow public auth routes through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip auth in dev for testing (set NEXT_PUBLIC_SKIP_AUTH=true in .env.local)
  if (process.env.NEXT_PUBLIC_SKIP_AUTH === "true") {
    return NextResponse.next();
  }

  // Token is set as a cookie by the auth store on login
  const token = request.cookies.get("access_token")?.value;

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Guard all app routes; skip static assets and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
