import { cache } from "react";

import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/**
 * Reads of the signed-in couple's own invitations.
 *
 * Separate from `lib/dal.js`, which is only about *who* the caller is. Same
 * rules apply though: the token is read here rather than passed in, so no call
 * site can forget it, and `cache` memoises within one render pass.
 *
 * Nothing throws. Like `apiFetch`, these return a result the page can render —
 * a sleeping backend is an ordinary Tuesday on Render's free tier, and a
 * dashboard that crashes on it is worse than one that says so.
 */

export const getMyWeddings = cache(async () => {
  const token = await getAccessToken();
  if (!token) return { ok: false, weddings: [], error: "Нэвтэрнэ үү." };

  const { ok, data, error } = await apiFetch("/weddings", { token });

  return {
    ok,
    weddings: ok && Array.isArray(data) ? data : [],
    error,
  };
});

/**
 * One invitation with everything the editor draws from: its sections, venues,
 * photos, and — via `template.contents` — the label and required flag for each
 * form. All of it arrives in a single request.
 */
export const getWedding = cache(async (weddingId) => {
  const token = await getAccessToken();
  if (!token) return { ok: false, wedding: null, error: "Нэвтэрнэ үү." };

  const { ok, data, error } = await apiFetch(`/weddings/${weddingId}`, { token });
  return { ok, wedding: ok ? data : null, error };
});

/**
 * Every reply a guest has sent, newest first, with the totals alongside.
 *
 * The counts come from the backend rather than being derived from `items` here.
 * They are aggregated in SQL over the whole table, and on a wedding with several
 * hundred guests that is the difference between a sum and pulling every reply
 * into the page to add them up. The two must not be re-derived in parallel
 * either — one place decides what "irne" means, and it is the same place that
 * decides a decline brings nobody.
 */
export const getRsvps = cache(async (weddingId) => {
  const token = await getAccessToken();
  if (!token) return { ok: false, stats: null, replies: [], error: "Нэвтэрнэ үү." };

  const { ok, data, error } = await apiFetch(`/weddings/${weddingId}/rsvps`, { token });

  return {
    ok,
    stats: ok ? data.stats : null,
    replies: ok ? (data.items ?? []) : [],
    error,
  };
});
