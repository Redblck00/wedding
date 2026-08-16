import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/dal";
import { getRsvps, getWedding } from "@/lib/weddings";
import RsvpRow from "./rsvp-row";

export const metadata = {
  title: "Ирэхээ мэдэгдсэн зочид",
};

/**
 * "2026-08-16T06:32:00Z" -> "8-р сарын 16 14:32".
 *
 * The time zone is pinned rather than taken from the machine. `responded_at` is
 * a real timestamptz and this page is a Server Component, so an unpinned
 * formatter renders in whatever zone the *server* happens to run in — which is
 * Asia/Ulaanbaatar on this laptop and UTC on Render, where the backend is going.
 * Every reply would read eight hours early in production and nowhere else, which
 * is the kind of bug that only shows up once guests are already replying.
 *
 * Pinned to Ulaanbaatar rather than resolved in the guest's browser, too. The
 * couple may be reading this from anywhere, but the replies are about a wedding
 * that happens in Mongolia at a Mongolian hour — the same reasoning
 * `lib/invitation.js` uses to keep the countdown on local time. It also keeps
 * this a Server Component: formatting in the browser would mean either shipping
 * a client component for a date or an SSR mismatch on every row.
 *
 * Built once at module scope. Constructing an `Intl.DateTimeFormat` is the
 * expensive part, and a wedding with two hundred replies would otherwise build
 * two hundred of them per render.
 */
const WHEN = new Intl.DateTimeFormat("mn-MN", {
  timeZone: "Asia/Ulaanbaatar",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatWhen(value) {
  const date = new Date(value);
  // An unparseable timestamp is not worth failing a page over — the reply's
  // name and answer are the part the couple came for.
  if (Number.isNaN(date.getTime())) return "";

  return WHEN.format(date);
}

export default async function RsvpInboxPage({ params }) {
  await requireUser();

  // `params` is a Promise in Next 16 — synchronous access was removed.
  const { id } = await params;

  // The wedding first, and on its own: it is what says this invitation is the
  // caller's at all. The backend scopes both routes to the owner, so a 404 here
  // covers "no such invitation" and "not yours" alike — which is what it should,
  // since the second must not be distinguishable by guessing ids.
  const { ok, wedding, error } = await getWedding(id);

  if (!ok && !wedding) {
    if (error) return <ErrorState message={error} />;
    notFound();
  }

  const { ok: repliesOk, stats, replies, error: repliesError } = await getRsvps(id);

  const names = [wedding.bride_name, wedding.groom_name].filter(Boolean).join(" & ");

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href={`/weddings/${wedding.id}`}
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← {names || "Урилга"}
      </Link>

      <h1 className="mt-6 font-display text-4xl font-light sm:text-5xl">Ирэх зочид</h1>

      {wedding.status === "published" ? (
        <p className="mt-2 text-sm text-muted">
          Зочид /wedding/{wedding.slug} хаягаар хариугаа илгээнэ.
        </p>
      ) : (
        // Worth saying plainly. The public page 404s for a draft and the submit
        // endpoint refuses one, so an empty inbox here is expected rather than
        // a sign that nobody has replied.
        <p className="mt-2 text-sm text-muted">
          Урилга хараахан нийтлэгдээгүй тул зочид хариу илгээх боломжгүй байна.
        </p>
      )}

      {!repliesOk ? (
        <ErrorNotice message={repliesError} />
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Хариу" value={stats.total_responses} />
            <Stat label="Ирнэ" value={stats.attending_count} tone="sage" />
            <Stat label="Ирэхгүй" value={stats.declined_count} />
            {/* The headcount, not the reply count: one reply can bring five
                people, and this is the number the caterer needs. */}
            <Stat label="Нийт хүн" value={stats.total_guests} tone="rose" />
          </dl>

          {replies.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-line px-5 py-12 text-center text-sm text-muted">
              Хариу хараахан ирээгүй байна.
            </p>
          ) : (
            <ul className="mt-8 space-y-3">
              {replies.map((reply) => (
                <RsvpRow
                  key={reply.id}
                  weddingId={wedding.id}
                  reply={reply}
                  when={formatWhen(reply.responded_at)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const colour = tone === "sage" ? "text-sage" : tone === "rose" ? "text-rose" : "text-ink";

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`mt-1 text-3xl font-light ${colour}`}>{value}</dd>
    </div>
  );
}

function ErrorNotice({ message }) {
  return (
    <p
      role="alert"
      className="mt-8 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
    >
      {message}
    </p>
  );
}

function ErrorState({ message }) {
  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-5 py-16 text-center">
      <p
        role="alert"
        className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
      >
        {message}
      </p>
      <Link href="/dashboard" className="mt-6 inline-block text-sm text-muted hover:text-ink">
        ← Миний урилгууд
      </Link>
    </div>
  );
}
