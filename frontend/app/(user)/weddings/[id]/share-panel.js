"use client";

import { useState, useSyncExternalStore } from "react";

/** The origin never changes, so there is nothing to subscribe to. */
const noSubscribe = () => () => {};
const clientOrigin = () => window.location.origin;
/** No `window` while rendering on the server; the URL fills in on hydration. */
const serverOrigin = () => null;

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
  const origin = useSyncExternalStore(noSubscribe, clientOrigin, serverOrigin);

  const url = origin ? `${origin}/wedding/${slug}` : `/wedding/${slug}`;

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
