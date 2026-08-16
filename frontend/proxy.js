import { NextResponse } from "next/server";

import { API_BASE_URL, COOKIE, IS_PRODUCTION } from "@/lib/config";

/**
 * Runs before every page request (see `config.matcher` below).
 *
 * Two jobs, and deliberately no more:
 *
 * 1. Refresh an expired access token. This is the one place it can happen —
 *    cookies cannot be written while a Server Component renders, so without it
 *    a signed-in couple would be thrown back to the login form every 15
 *    minutes.
 * 2. Redirect on the *shape* of the session, without asking the backend who the
 *    user is. Proxy runs on prefetches too, so a per-request lookup here would
 *    multiply traffic to a backend that may be cold-starting.
 *
 * These are optimistic checks. Real enforcement is `lib/dal.js`, next to the
 * data, and the backend behind it.
 */

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
};

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Signed-in-only areas. Everything not listed is public.
 *
 * `/weddings` (plural) is the owner's editor. The guest-facing invitation is
 * `/wedding/{slug}` (singular) and must stay public — the same split the
 * backend makes between its `/weddings` and `/wedding` routers.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/weddings"];
const ADMIN_PREFIXES = ["/admin"];

/** Pages a signed-in user has no reason to see. */
const GUEST_ONLY = ["/login", "/register"];

function startsWithAny(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function refreshTokens(refreshToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    return response.ok ? await response.json() : null;
  } catch {
    // The backend being unreachable is not proof the session is invalid, so
    // this returns null and the caller treats the visitor as signed out for
    // this request only — without clearing their cookies.
    return null;
  }
}

function applySession(response, session) {
  response.cookies.set({
    ...COOKIE_OPTIONS,
    name: COOKIE.access,
    value: session.access_token,
    maxAge: session.expires_in,
  });
  response.cookies.set({
    ...COOKIE_OPTIONS,
    name: COOKIE.refresh,
    value: session.refresh_token,
    maxAge: REFRESH_MAX_AGE,
  });
  response.cookies.set({
    ...COOKIE_OPTIONS,
    name: COOKIE.role,
    value: session.user.role,
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}

function clearSession(response) {
  for (const name of Object.values(COOKIE)) {
    response.cookies.set({ ...COOKIE_OPTIONS, name, value: "", maxAge: 0 });
  }
  return response;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  let accessToken = request.cookies.get(COOKIE.access)?.value;
  const refreshToken = request.cookies.get(COOKIE.refresh)?.value;
  let role = request.cookies.get(COOKIE.role)?.value;

  let renewed = null;
  let sessionExpired = false;

  // The access cookie is given the token's own lifetime, so its absence *is*
  // expiry — no need to parse or verify the JWT to find that out.
  if (!accessToken && refreshToken) {
    renewed = await refreshTokens(refreshToken);

    if (renewed) {
      accessToken = renewed.access_token;
      role = renewed.user.role;
      // Make the new token visible to the render this request is about to do;
      // `response.cookies` alone would only reach the *next* request.
      request.cookies.set(COOKIE.access, renewed.access_token);
      request.cookies.set(COOKIE.refresh, renewed.refresh_token);
      request.cookies.set(COOKIE.role, renewed.user.role);
    } else {
      // Refresh tokens rotate, so a rejected one is spent for good. Clearing it
      // is what stops every later request paying for another failed round trip.
      sessionExpired = true;
    }
  }

  const signedIn = Boolean(accessToken);

  const finish = (response) => {
    if (renewed) return applySession(response, renewed);
    if (sessionExpired) return clearSession(response);
    return response;
  };

  if (!signedIn && startsWithAny(pathname, [...PROTECTED_PREFIXES, ...ADMIN_PREFIXES])) {
    const target = new URL("/login", request.url);
    // Carried so the login form can send them where they were headed, rather
    // than dropping everyone on the dashboard.
    target.searchParams.set("next", pathname);
    return finish(NextResponse.redirect(target));
  }

  if (signedIn && role !== "admin" && startsWithAny(pathname, ADMIN_PREFIXES)) {
    return finish(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (signedIn && GUEST_ONLY.includes(pathname)) {
    return finish(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  return finish(NextResponse.next({ request }));
}

export const config = {
  matcher: [
    /**
     * Everything except Next's own assets and files with an extension.
     *
     * The extension exclusion is what keeps the couple's uploaded photos and
     * anything in `public/` from paying for a proxy pass — and, more to the
     * point, from triggering a token refresh on an image request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};
