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
