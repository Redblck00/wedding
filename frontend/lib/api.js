import { API_BASE_URL } from "@/lib/config";

/**
 * One call to the FastAPI backend.
 *
 * Never throws on an HTTP error status — the backend uses 401/402/409/429 as
 * ordinary answers a form has to render, and an exception would turn each of
 * them into a crashed page. Callers branch on `ok` instead.
 *
 * Returns `{ ok, status, data, error }` where `error` is the backend's `detail`
 * string, already reduced to something a person can read.
 */
export async function apiFetch(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      // Auth and dashboard reads must never be served from a cache: one
      // couple's session would otherwise answer another's request.
      cache: options.cache ?? "no-store",
    });
  } catch {
    // A sleeping backend (Render's free tier spins down) or a wrong
    // API_BASE_URL both land here. Say so plainly instead of leaking a stack.
    return {
      ok: false,
      status: 0,
      data: null,
      error: "Серверт холбогдож чадсангүй. Түр хүлээгээд дахин оролдоно уу.",
    };
  }

  // 204 has no body, and calling .json() on it throws.
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
    error: response.ok ? null : readError(data, response.status),
  };
}

/**
 * Uploads one file to `POST /weddings/{id}/media`.
 *
 * Separate from `apiFetch` rather than an option on it: multipart needs the
 * boundary the runtime generates, and that only survives if the Content-Type
 * header is left off entirely — which is the one thing `apiFetch` always sets.
 *
 * Returns `{ ok, status, asset, error }`. `status` is carried through so a
 * caller can say something specific about the ones that mean a particular
 * thing — 413 for a file over the limit, most of all.
 */
export async function uploadMedia(weddingId, file, token) {
  const body = new FormData();
  body.append("file", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/weddings/${weddingId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
      cache: "no-store",
    });
  } catch (error) {
    // Logged rather than swallowed: this branch is where every failed upload
    // ends, and without the cause there is no way to tell a refused connection
    // from a timeout from a socket the backend closed. `error.cause` is where
    // `fetch` keeps it — undici flattens everything to "fetch failed" and the
    // `code` underneath is the part that names the problem.
    console.error(
      `[uploadMedia] POST ${API_BASE_URL}/weddings/${weddingId}/media failed —`,
      error?.cause?.code ?? error?.cause?.message ?? error?.message ?? error,
    );

    return {
      ok: false,
      status: 0,
      asset: null,
      error: "Серверт холбогдож чадсангүй. Дахин оролдоно уу.",
    };
  }

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    asset: response.ok ? data : null,
    error: response.ok ? null : readError(data, response.status),
  };
}

/**
 * FastAPI's `detail` is a string for `HTTPException` but an array of field
 * objects for a 422 validation failure. Both have to become one line of text.
 */
function readError(data, status) {
  const detail = data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first?.msg === "string") return first.msg;
  }

  if (status === 429) return "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.";

  return "Алдаа гарлаа. Дахин оролдоно уу.";
}
