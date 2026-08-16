"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteRsvp } from "@/app/actions/rsvp";

/**
 * One guest's reply.
 *
 * A client component only because of the delete, which needs a confirmation
 * step and somewhere to put the failure. Everything above it on the page stays
 * a Server Component, so the list itself costs the couple no JavaScript.
 */
export default function RsvpRow({ weddingId, reply, when }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState(null);
  const [busy, startTransition] = useTransition();

  function remove() {
    setMessage(null);

    startTransition(async () => {
      const body = new FormData();
      body.append("wedding_id", weddingId);
      body.append("rsvp_id", reply.id);

      const result = await deleteRsvp(null, body);

      if (result?.message) {
        setMessage(result.message);
        setConfirming(false);
        return;
      }

      // The action revalidates the page; this is what makes the row actually
      // disappear rather than waiting for the next navigation.
      router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-line bg-white/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="truncate text-base">{reply.guest_name}</span>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                reply.attending ? "bg-sage/15 text-sage" : "bg-shell text-muted"
              }`}
            >
              {reply.attending
                ? // The headcount includes the guest who replied, so "irne" on
                  // its own means one person. Repeating "1 хүн" on every single
                  // reply would be noise.
                  reply.number_of_guests > 1
                  ? `Ирнэ · ${reply.number_of_guests} хүн`
                  : "Ирнэ"
                : "Ирэхгүй"}
            </span>
          </p>

          {reply.guest_contact ? (
            <p className="mt-1 text-sm text-muted">
              {/* Tappable: the couple reads this on a phone and the next thing
                  they do with a number is ring it. */}
              <a href={`tel:${reply.guest_contact.replace(/\s/g, "")}`}>{reply.guest_contact}</a>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs text-muted">{when}</span>

          {confirming ? (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="min-h-9 rounded-full border border-rose/40 px-4 text-xs text-rose transition-colors hover:bg-rose/5 disabled:opacity-60"
              >
                {busy ? "Устгаж байна…" : "Устгах"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="min-h-9 text-xs text-muted transition-colors hover:text-ink disabled:opacity-60"
              >
                Болих
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`${reply.guest_name}-ийн хариуг устгах`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-sm text-muted transition-colors hover:border-rose/40 hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {reply.message ? (
        <p className="mt-4 whitespace-pre-line border-l-2 border-line pl-4 text-sm leading-6 text-muted">
          {reply.message}
        </p>
      ) : null}

      {message ? (
        <p role="alert" className="mt-3 text-sm text-rose">
          {message}
        </p>
      ) : null}
    </li>
  );
}
