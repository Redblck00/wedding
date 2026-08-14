/**
 * The user (couple) section: signing in, signing up, and the dashboard behind
 * them. The admin console lives in `app/(admin)` and shares nothing but the
 * root layout.
 *
 * Route groups, so `(user)` never appears in a URL — these pages are `/login`,
 * `/register` and `/dashboard`.
 *
 * No auth check here on purpose. A layout does not re-render between
 * navigations and cannot stop its children from rendering, so a guard placed
 * here would look like protection without being any. That job belongs to
 * `requireUser()` in each protected page, with `proxy.js` doing the cheap
 * redirect first.
 */
export default function UserLayout({ children }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
