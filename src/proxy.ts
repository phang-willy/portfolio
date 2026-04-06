import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { LOCALE_COOKIE_NAME } from "@/features/i18n/lib/locale-cookie";
import { resolveRootLocalePreference } from "@/features/i18n/lib/resolve-root-locale-preference";

function applySecurityHeaders(res: NextResponse, request: NextRequest) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.headers.set("X-DNS-Prefetch-Control", "on");

  if (request.nextUrl.protocol === "https:") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/" || pathname === "") {
    const preferred = resolveRootLocalePreference({
      cookieLocale: request.cookies.get(LOCALE_COOKIE_NAME)?.value,
      acceptLanguage: request.headers.get("accept-language"),
    });
    if (preferred === "en") {
      const res = NextResponse.redirect(new URL("/en", request.url));
      applySecurityHeaders(res, request);
      return res;
    }
  }

  const res = NextResponse.next();
  applySecurityHeaders(res, request);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|logo.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
