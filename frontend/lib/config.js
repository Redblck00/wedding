/**
 * Environment access, in one place so a missing variable fails here rather than
 * as a confusing fetch error deep inside a request.
 */

/**
 * Base URL of the FastAPI backend, including its `/v1` prefix.
 *
 * Deliberately *not* `NEXT_PUBLIC_`: every backend call goes through a Server
 * Action or a Server Component, so the browser never needs this value. Keeping
 * it server-only means the API host stays out of the client bundle and the
 * access token never has to reach the browser to be useful.
 */
export const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000/v1";

/** Cookie names, grouped so `proxy.js` and the session helpers cannot drift. */
export const COOKIE = {
  access: "wedding_access",
  refresh: "wedding_refresh",
  /**
   * The signed-in user's role, mirrored out of the login response so `proxy.js`
   * can gate `/admin` without a network call. Optimistic only: the backend
   * re-checks every admin route, so a forged cookie buys nothing but an empty
   * shell that fails its first data request.
   */
  role: "wedding_role",
};

/**
 * `secure` cookies are dropped by browsers over plain http, which would make
 * login silently fail on localhost — so the flag follows the environment.
 */
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
