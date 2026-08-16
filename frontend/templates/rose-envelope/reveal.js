"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "./use-reduced-motion";

/**
 * Soft cinematic reveal: a block of text rises a little and fades up as it
 * comes into view, once, and stays.
 *
 * Two things are done differently from the Figma prototype this copies:
 *
 * 1. Its stagger does not actually work. `.reveal` animates with a CSS
 *    `transition`, but `.delay-200`/`.delay-400` set `animation-delay`, which a
 *    transition never reads — so every "staggered" line in that build arrives at
 *    once. Here the delay is a `transition-delay`, which is the property the
 *    animation is actually using.
 *
 * 2. It finds new elements by re-scanning the document every 300ms with
 *    `setInterval` and re-observing whatever is not yet visible. That is a poll
 *    that never stops, on a page a guest keeps open. Each block here registers
 *    its own element on mount and unregisters when it fires.
 *
 * One observer for the whole page rather than one per block: an invitation has
 * dozens of these, and a separate `IntersectionObserver` for each is dozens of
 * separate callback queues doing the same work.
 */

let observer = null;

/** element -> what to call when it first comes into view. */
const waiting = new Map();

function stopWatching(element) {
  waiting.delete(element);
  observer?.unobserve(element);
}

function watch(element, onEnter) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          waiting.get(entry.target)?.();
          // Reveals are one-way, so the element is dropped as soon as it fires.
          // Left observed, every block on the page would keep reporting for the
          // rest of the visit.
          stopWatching(entry.target);
        }
      },
      {
        // A short way up from the bottom edge, so a line starts moving once it
        // is properly on screen rather than while it is still a sliver.
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.12,
      },
    );
  }

  waiting.set(element, onEnter);
  observer.observe(element);
}

export default function Reveal({ children, delay = 0, distance = 28, className = "" }) {
  const ref = useRef(null);
  const [entered, setEntered] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reduced) return;

    watch(element, () => setEntered(true));
    return () => stopWatching(element);
  }, [reduced]);

  // Reduced motion shows everything at once, in place. Not "the animation, but
  // faster" — the point is that nothing moves.
  const shown = entered || reduced;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${distance}px)`,
        // The same easing the envelope opens with, so the whole invitation
        // moves in one accent. Dropped entirely under reduced motion — a
        // transition the guest asked not to see should not merely be short.
        transition: reduced
          ? undefined
          : `opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
