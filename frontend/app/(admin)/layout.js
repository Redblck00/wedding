/**
 * The admin section — the platform owner's console, not the couple's.
 *
 * It maps to the backend's `app/api/routers/admin/` routers (template
 * authoring, users, payments), all of which sit behind `CurrentAdmin` and are
 * still stubs. So this side of the app deliberately stays thin until they land.
 *
 * As in `(user)/layout.js`, no auth check here: the guard is `requireAdmin()`
 * inside each page, where it actually gates the data.
 */
export default function AdminLayout({ children }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
