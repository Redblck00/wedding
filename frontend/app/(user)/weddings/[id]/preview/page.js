import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/dal";
import { buildInvitation } from "@/lib/invitation";
import { getWedding } from "@/lib/weddings";
import { InvitationTemplate } from "@/templates/registry";

export const metadata = {
  title: "Урьдчилан үзэх",
};

/**
 * The couple's own invitation, exactly as a guest will see it — before anyone
 * else can.
 *
 * Built from the *owner's* payload rather than `GET /wedding/{slug}`, which
 * answers 404 for anything unpublished. `buildInvitation` only reads
 * `sections`, `venues`, `media_assets` and the wedding's own columns, and the
 * owner's response carries all four — so a draft renders here with no backend
 * change and no way to reach it without owning the wedding.
 *
 * Without this the couple fills in five sections blind and finds out how it
 * looks only by publishing, which is the one step that is hard to take back.
 */
export default async function PreviewPage({ params }) {
  await requireUser();

  const { id } = await params;

  const { ok, wedding } = await getWedding(id);
  if (!ok || !wedding) notFound();

  return (
    <>
      {/*
        Fixed rather than in the flow: the template below is a full-bleed
        design that starts at the top of the viewport, and anything above it
        would push the envelope off-screen. z-60 clears the invitation's own
        floating music button at z-50.
      */}
      <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between gap-3 border-b border-line bg-ivory/90 px-4 py-2 backdrop-blur">
        <Link href={`/weddings/${id}`} className="text-sm text-muted hover:text-ink">
          ← Засвар руу
        </Link>
        <span className="text-xs text-muted">
          Урьдчилан үзэж байна
          {wedding.status !== "published" ? " · хараахан нийтлэгдээгүй" : ""}
        </span>
      </div>

      {/*
        `template.code`, not `template_code`. The two responses name it
        differently: the guest page reads `PublicWeddingRead`, which flattens it
        to a top-level `template_code`, while the owner's `WeddingDetailRead`
        embeds the whole template — so the flat field is simply absent here and
        reading it renders the fallback instead of the design.

        `preview` stops the RSVP form submitting: the couple looking at their
        own invitation must not file a reply to it by accident.
      */}
      <InvitationTemplate
        code={wedding.template?.code}
        invitation={buildInvitation(wedding)}
        preview
        fallback={
          <div className="flex min-h-screen items-center justify-center px-6 text-center">
            <p className="text-sm text-muted">Энэ загварыг харуулах боломжгүй байна.</p>
          </div>
        }
      />
    </>
  );
}
