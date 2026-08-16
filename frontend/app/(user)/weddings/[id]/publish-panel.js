"use client";

import { useActionState } from "react";

import { publishWedding } from "@/app/actions/weddings";
import SubmitButton from "@/components/submit-button";

/**
 * Publish / unpublish, with whatever is blocking it shown underneath.
 *
 * The blocker list is not computed here. `POST /weddings/{id}/publish` answers
 * 422 with every reason in one sentence-per-blocker string, and re-deriving
 * those rules in the browser is how the two ends drift apart.
 */
export default function PublishPanel({ weddingId, status }) {
  const [state, formAction, pending] = useActionState(publishWedding, undefined);

  const published = status === "published";

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <h2 className="font-display text-xl">
        {published ? "Урилга нийтлэгдсэн" : "Нийтлэхэд бэлэн үү?"}
      </h2>

      {/* The link and the QR live in `SharePanel` below — repeating the address
          here left two copies of the one thing that must not be got wrong. */}
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {published
          ? "Зочид линкээр орж, ирэхээ баталгаажуулж байна."
          : "Нийтэлсний дараа зочид линкээр орж, ирэхээ баталгаажуулж эхэлнэ."}
      </p>

      {state?.message ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm leading-relaxed text-rose"
        >
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="mt-5">
        <input type="hidden" name="wedding_id" value={weddingId} />
        <input type="hidden" name="intent" value={published ? "unpublish" : "publish"} />

        <SubmitButton pending={pending} pendingLabel="Түр хүлээнэ үү…">
          {published ? "Нийтлэхээ болих" : "Нийтлэх"}
        </SubmitButton>
      </form>
    </div>
  );
}
