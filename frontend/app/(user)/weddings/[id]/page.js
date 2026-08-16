import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/dal";
import { isEditableSection } from "@/lib/sections";
import { getWedding } from "@/lib/weddings";
import PublishPanel from "./publish-panel";
import SharePanel from "./share-panel";

export const metadata = {
  title: "Урилга засах",
};

/**
 * True once a section holds something a guest could read.
 *
 * Mirrors `_is_filled` in `wedding_service.py`: a section seeded from a
 * template's `default_content` has keys before the couple has typed anything,
 * so the test has to look at the values. Kept in step deliberately — this is
 * what tells the couple which forms still need them, and the backend's publish
 * gate must not disagree with the ticks on this page.
 */
function isFilled(content) {
  return Object.values(content ?? {}).some(
    (value) =>
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0) &&
      !(value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0),
  );
}

export default async function WeddingEditorPage({ params }) {
  await requireUser();

  // `params` is a Promise in Next 16 — synchronous access was removed.
  const { id } = await params;

  const { ok, wedding, error } = await getWedding(id);

  // The backend scopes every wedding route to its owner, so a 404 here covers
  // both "no such invitation" and "not yours" — which is what it should: the
  // second must not be distinguishable by guessing ids.
  if (!ok && !wedding) {
    if (error) return <ErrorState message={error} />;
    notFound();
  }

  const names = [wedding.bride_name, wedding.groom_name].filter(Boolean).join(" & ");

  // The label, order and required flag for every form — all from the one
  // request above, via `template.contents`.
  const definitions = wedding.template?.contents ?? [];
  const byType = new Map(wedding.sections.map((section) => [section.section_type, section]));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link href="/dashboard" className="text-sm text-muted transition-colors hover:text-ink">
        ← Миний урилгууд
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-light sm:text-5xl">
            {names || "Нэр оруулаагүй"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {wedding.template?.name} · /wedding/{wedding.slug}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Reachable at every stage, not only once published: the public page
              404s for a draft, so this is the couple's only way to see what they
              are building before they commit to it. */}
          <Link
            href={`/weddings/${wedding.id}/preview`}
            className="min-h-11 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-rose/40"
          >
            Урьдчилан үзэх
          </Link>

          {/* Also shown on a draft, where the inbox is necessarily empty. The
              page says why, which beats hiding the link and leaving the couple
              wondering where replies are supposed to appear. */}
          <Link
            href={`/weddings/${wedding.id}/rsvps`}
            className="min-h-11 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-rose/40"
          >
            Ирэх зочид
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-[1fr_18rem] md:items-start">
        <section>
          <h2 className="font-display text-xl">Хэсгүүд</h2>
          <p className="mt-1 text-sm text-muted">
            Энэ загвар {definitions.length} хэсэгтэй. Тэмдэглэгдээгүй нь хоосон байна.
          </p>

          <ul className="mt-5 space-y-2">
            {definitions.map((definition) => {
              const section = byType.get(definition.section_type);
              const filled = isFilled(section?.content);
              const editable = isEditableSection(definition.section_type);

              const row = (
                <>
                  <div className="min-w-0">
                    <p className="truncate">
                      {definition.display_name}
                      {definition.is_required ? (
                        <span className="ml-2 text-xs text-rose">заавал</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {editable ? definition.section_type : "Маягт удахгүй"}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                      filled ? "bg-sage/15 text-sage" : "bg-shell text-muted"
                    }`}
                  >
                    {filled ? "Бөглөсөн" : "Хоосон"}
                  </span>
                </>
              );

              const shared = "flex items-center justify-between gap-4 rounded-2xl border px-5 py-4";

              return (
                <li key={definition.id}>
                  {editable ? (
                    <Link
                      href={`/weddings/${wedding.id}/sections/${definition.section_type}`}
                      className={`${shared} border-line bg-white/60 transition-colors hover:border-rose/40`}
                    >
                      {row}
                    </Link>
                  ) : (
                    // Not a link while it has nowhere to go — a row that looks
                    // tappable and does nothing reads as a broken page.
                    <div className={`${shared} border-line/60 bg-white/30`}>{row}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-5 rounded-2xl border border-dashed border-line px-5 py-4 text-sm text-muted">
            Үлдсэн хэсгүүдийн маягт удахгүй нэмэгдэнэ.
          </p>
        </section>

        <aside className="space-y-4">
          <PublishPanel weddingId={wedding.id} status={wedding.status} />

          {wedding.status === "published" ? (
            <SharePanel weddingId={wedding.id} slug={wedding.slug} />
          ) : null}

          <div className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
            <p className="text-muted">Зураг</p>
            <p className="mt-1 text-2xl font-light">{wedding.media_assets.length}</p>
            <p className="mt-1 text-xs text-muted">Нийтлэхэд дор хаяж 3 хэрэгтэй.</p>
          </div>

          <div className="rounded-2xl border border-line bg-white/60 p-5 text-sm">
            <p className="text-muted">Байршил</p>
            <p className="mt-1 text-2xl font-light">{wedding.venues.length}</p>
            <p className="mt-1 text-xs text-muted">Нийтлэхэд дор хаяж 1 хэрэгтэй.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-5 py-16 text-center">
      <p role="alert" className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
        {message}
      </p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm text-muted hover:text-ink">
        ← Миний урилгууд
      </Link>
    </div>
  );
}
