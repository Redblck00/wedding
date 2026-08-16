import { notFound } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { buildInvitation } from "@/lib/invitation";
import { InvitationTemplate } from "@/templates/registry";

/**
 * The guest-facing invitation. This is the page a QR code opens.
 *
 * `GET /v1/wedding/{slug}` answers 404 for a draft as well as for a slug that
 * does not exist, so an unpublished invitation cannot be found by guessing.
 * Both arrive here as the same `notFound()`.
 */
async function loadWedding(slug) {
  const { ok, data } = await apiFetch(`/wedding/${encodeURIComponent(slug)}`);
  return ok ? data : null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const wedding = await loadWedding(slug);

  if (!wedding) return { title: "Урилга олдсонгүй" };

  // Resolved the same way the page body does, rather than off `bride_name` on
  // the wedding row: that column is what the couple typed when they picked their
  // URL, and the section holds whatever they edited it to since. Reading the row
  // here would put one name in the tab and a different one on the page.
  const { brideName, groomName } = buildInvitation(wedding);

  const names = [brideName, groomName].filter(Boolean).join(" & ");
  const title = names ? `${names} — хуримын урилга` : "Хуримын урилга";

  // These links are shared in chat apps, where the preview card is most of what
  // a guest sees before deciding to tap.
  return {
    title,
    openGraph: { title, type: "website" },
  };
}

export default async function PublicWeddingPage({ params }) {
  const { slug } = await params;

  const wedding = await loadWedding(slug);
  if (!wedding) notFound();

  // The catalogue can name a design this build does not ship — the backend
  // deploys separately, and a code can arrive before its component does. Better
  // a plain apology than a blank screen with a console error.
  return (
    <InvitationTemplate
      code={wedding.template_code}
      invitation={buildInvitation(wedding)}
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <div>
            <h1 className="font-display text-3xl">Урилга бэлтгэгдэж байна</h1>
            <p className="mt-3 text-sm text-muted">Түр хүлээгээд дахин оролдоно уу.</p>
          </div>
        </div>
      }
    />
  );
}
