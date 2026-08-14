"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * A photograph that degrades into a tinted placeholder instead of a broken icon.
 *
 * Needed because the pictures arrive after the layout does: while `public/` is
 * still empty the page has to look finished, not half-built. The check is done
 * with `onError` in the browser rather than by looking for the file on disk —
 * on Vercel the static assets are served from the CDN and are not necessarily
 * present in the rendering function's filesystem, so a server-side existence
 * check would report every photograph missing in production.
 */
export default function Photo({
  src,
  alt = "",
  priority = false,
  sizes = "100vw",
  className = "",
  placeholderClassName = "",
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        // Decorative stand-in: it carries no information a screen reader needs,
        // and announcing "image failed to load" to a guest helps nobody.
        aria-hidden="true"
        className={`bg-gradient-to-br from-shell via-rose-soft/35 to-gold/25 ${placeholderClassName || className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
