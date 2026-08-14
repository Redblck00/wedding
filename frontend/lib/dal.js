import { cache } from "react";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/**
 * Data access layer.
 *
 * Every read of the signed-in user goes through here so the auth check cannot
 * be forgotten at a call site. Layouts deliberately do *not* guard routes: a
 * layout does not re-render on navigation and does not control whether its
 * children render, so a check there protects nothing. The guard belongs next to
 * the data — here — with `proxy.js` only doing the cheap optimistic redirect.
 *
 * `cache` memoises within a single render pass, so a page and the nav in its
 * layout asking for the user costs one request, not two.
 */

export const getCurrentUser = cache(async () => {
  const token = await getAccessToken();
  if (!token) return null;

  const { ok, data } = await apiFetch("/users/me", { token });
  return ok ? data : null;
});

/**
 * The user, or a redirect to login. Use in any page that must not render for a
 * signed-out visitor.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * The user, or a redirect, when the route is admin-only.
 *
 * Re-checked here rather than trusting the role cookie `proxy.js` reads: that
 * cookie is client-held and only good enough to decide what to render
 * optimistically. This one comes from the backend's own answer.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}
