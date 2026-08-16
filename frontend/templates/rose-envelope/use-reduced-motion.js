"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether the guest has asked their device for less movement.
 *
 * `useSyncExternalStore` rather than reading `matchMedia` into state from an
 * effect. A media query is exactly the "external system" the hook exists for,
 * and it is the one way to read one without a hydration mismatch: React renders
 * `getServerSnapshot` first, then reconciles against the real value itself
 * instead of the two disagreeing in the markup.
 *
 * `framer-motion` ships its own `useReducedMotion`, and it is not usable here —
 * it reads `matchMedia` straight into `useState`'s initial value, so a guest
 * with the setting on gets one render on the server and a different one in the
 * browser.
 *
 * The `prefers-reduced-motion` block in `globals.css` does not replace this. CSS
 * can only neutralise an animation that is already running; it cannot decide not
 * to render sixty pieces of confetti, and on an element whose resting state is
 * `opacity: 0` it would leave the content invisible rather than still.
 */
function subscribe(onChange) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function read() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** No window to ask on the server, and "animate" is the safe default: it is the
 *  branch whose markup the browser can correct to either answer. */
function readOnServer() {
  return false;
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, read, readOnServer);
}
