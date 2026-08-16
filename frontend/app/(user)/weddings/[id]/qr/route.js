import { API_BASE_URL } from "@/lib/config";
import { getAccessToken } from "@/lib/session";

/**
 * Streams the invitation's QR code out of the backend.
 *
 * A route handler rather than pointing an `<img>` straight at the API, for two
 * reasons that both come from the same decision: `API_BASE_URL` is deliberately
 * not `NEXT_PUBLIC_`, so the browser does not know where the backend is — and
 * `GET /weddings/{id}/qr` needs a bearer token, which an `<img>` tag has no way
 * to send. Here the token is read from the httpOnly cookie server-side and
 * never reaches the page.
 *
 * Ownership is not re-checked: the backend's `OwnedWedding` dependency scopes
 * the QR to its owner, and forwarding the caller's own token is what proves who
 * they are. A request with no cookie is refused before it costs a round trip.
 */

/** Matches the backend's `box_size` bounds. Bigger is for printing. */
const MIN_BOX = 4;
const MAX_BOX = 40;

export async function GET(request, { params }) {
  // `params` is a Promise in Next 16 — synchronous access was removed.
  const { id } = await params;

  const token = await getAccessToken();
  if (!token) return new Response("Unauthorized", { status: 401 });

  const requested = Number(new URL(request.url).searchParams.get("box") ?? 10);
  const box = Math.min(MAX_BOX, Math.max(MIN_BOX, Number.isFinite(requested) ? requested : 10));

  let upstream;
  try {
    upstream = await fetch(`${API_BASE_URL}/weddings/${id}/qr?box_size=${box}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unavailable", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "image/png",
      // The QR encodes the slug, and the slug is editable. Caching it would let
      // a stale code outlive the URL it points at — which, once printed, is the
      // one failure that cannot be fixed.
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${id}-qr.png"`,
    },
  });
}
