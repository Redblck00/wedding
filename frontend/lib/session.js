import { cookies } from "next/headers";

import { COOKIE, IS_PRODUCTION } from "@/lib/config";

/**
 * Reads and writes the signed-in session.
 *
 * The backend is the auth authority — it issues the JWTs and we only carry
 * them. So there is no session encryption here: re-signing a token we did not
 * mint would add a second source of truth without adding any security.
 *
 * Every cookie is `httpOnly`, which is the whole point of holding the tokens
 * server-side. The refresh token lives for 30 days; leaving that in
 * `localStorage` would put a month of account access one XSS away.
 *
 * NOTE: cookies can only be *written* from a Server Action, a Route Handler or
 * `proxy.js` — never while a Server Component renders. That is why the token
 * refresh lives in `proxy.js` and not in the data layer.
 */

const BASE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  // `lax` still sends the cookie when a guest follows a link in from Facebook
  // or Messenger, while withholding it from cross-site POSTs.
  sameSite: "lax",
  path: "/",
};

/** 30 days, matching the backend's `refresh_token_expire_days` default. */
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export async function saveSession({ access_token, refresh_token, expires_in, user }) {
  const store = await cookies();

  store.set(COOKIE.access, access_token, {
    ...BASE_OPTIONS,
    // Expiring the cookie exactly when the token does turns "is it still
    // valid?" into "does the cookie exist?", which `proxy.js` can answer
    // without parsing or verifying anything.
    maxAge: expires_in,
  });
  store.set(COOKIE.refresh, refresh_token, { ...BASE_OPTIONS, maxAge: REFRESH_MAX_AGE });
  store.set(COOKIE.role, user.role, { ...BASE_OPTIONS, maxAge: REFRESH_MAX_AGE });
}

export async function clearSession() {
  const store = await cookies();
  for (const name of Object.values(COOKIE)) {
    store.delete(name);
  }
}

export async function getAccessToken() {
  const store = await cookies();
  return store.get(COOKIE.access)?.value ?? null;
}

export async function getRefreshToken() {
  const store = await cookies();
  return store.get(COOKIE.refresh)?.value ?? null;
}

export async function getRole() {
  const store = await cookies();
  return store.get(COOKIE.role)?.value ?? null;
}
