"use client";

import { useState, useSyncExternalStore } from "react";

/** The origin never changes, so there is nothing to subscribe to. */
const noSubscribe = () => () => {};
const clientOrigin = () => window.location.origin;
/** No `window` while rendering on the server; the URL fills in on hydration. */
const serverOrigin = () => null;

/**
 * The address the invitation is handed out at, when the deployment has been
 * told what it is.
 *
 * The couple's browser is not a reliable source for this. Vercel serves the
 * same project at several hostnames — the project's own `*.vercel.app`, a
 * `*-git-<branch>-*` per branch, and a `*-<hash>-*` per deployment — and a link
 * copied off one of the last two carries two faults a guest sees before the
 * invitation: those hostnames sit behind Vercel Authentication, so the guest is
 * asked to sign in to Vercel, and they are replaced on the next deploy, so the
 * link stops working. Neither is visible to the couple, whose own session
 * opens all of them.
 *
 * Inlined at build time, so the link is right in the server-rendered HTML too.
 * Unset, this falls back to the browser's own origin — which is what makes
 * `localhost:3000` work without configuring anything.
 */
const CANONICAL_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || null;

/**
 * Everything the couple needs to actually hand the invitation out: the link,
 * the QR for a printed card, and a way to look at it themselves.
 *
 * Only rendered once published — the link 404s for a draft, and a QR printed
 * from one would be dead on arrival.
 */
export default function SharePanel({ weddingId, slug }) {
  const [copied, setCopied] = useState(false);

  // Read through a store rather than an effect: the server has no `window`, and
  // guessing the origin would put a different URL in the HTML than in the
  // browser and trip hydration. Writing it from an effect does the same job but
  // cascades a second render on every mount.
  const browserOrigin = useSyncExternalStore(noSubscribe, clientOrigin, serverOrigin);

  const origin = CANONICAL_ORIGIN ?? browserOrigin;
  const url = origin ? `${origin}/wedding/${slug}` : `/wedding/${slug}`;

  // Worth saying out loud when the two differ: the couple is reading a link
  // that is not the address in their own bar, and without a word here that
  // looks like a bug rather than the fix for one.
  const elsewhere = Boolean(CANONICAL_ORIGIN && browserOrigin && browserOrigin !== CANONICAL_ORIGIN);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is refused outside https (and in some in-app
      // browsers). The link is on screen and selectable, so this is not worth
      // an error banner.
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white/60 p-5">
      <h2 className="font-display text-xl">Урилгаа тараах</h2>

      <p className="mt-3 break-all rounded-xl bg-shell px-3 py-2 text-xs text-ink">{url}</p>

      {elsewhere ? (
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Та энэ хуудсыг түр (preview) хаягаар нээсэн байна. Зочдод өгөх линк нь дээрх үндсэн
          хаягаар үүссэн — түр хаягийг хуваалцвал зочид Vercel-д нэвтрэхийг шаардана.
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="min-h-11 flex-1 rounded-full border border-line px-3 text-sm transition-colors hover:border-rose/40"
        >
          {copied ? "Хуулагдлаа ✓" : "Линк хуулах"}
        </button>

        <a
          href={`/wedding/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-3 text-sm transition-colors hover:border-rose/40"
        >
          Нээж үзэх
        </a>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <p className="text-sm text-muted">QR код</p>

        {/* Plain <img>, not next/image: this is a route handler streaming a
            no-store PNG, and running it through the image optimiser would cache
            a code whose slug can still change. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/weddings/${weddingId}/qr?box=8`}
          alt={`${slug} урилгын QR код`}
          width={200}
          height={200}
          className="mx-auto mt-3 h-auto w-full max-w-[200px] rounded-xl border border-line bg-white p-2"
        />

        <a
          href={`/weddings/${weddingId}/qr?box=24`}
          download={`${slug}-qr.png`}
          className="mt-3 flex min-h-11 items-center justify-center rounded-full border border-line px-3 text-sm transition-colors hover:border-rose/40"
        >
          Хэвлэхэд тохирсон хэмжээгээр татах
        </a>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          ⚠ Хэвлэсний дараа урилгын хаягаа солиж болохгүй — QR ажиллахаа болино.
        </p>
      </div>
    </div>
  );
}
