"use client";

import { useEffect, useRef } from "react";

/**
 * How far a tall section has travelled through the viewport, 0 → 1.
 *
 * 0 when its top reaches the top of the screen, 1 when its bottom leaves. Meant
 * for the `height: 200vh` + `position: sticky` pattern the scroll-driven scenes
 * use: the sticky child stays put while this drives what it draws.
 *
 * Reports through a callback rather than returning state, and that is the whole
 * point of it. As a `useState` hook this fired a React render on every scroll
 * frame — three of them at once, since the gallery, the programme and the
 * closing scene each ran one — so a phone was reconciling three component trees
 * per frame while the guest's finger waited on the same thread. The callback
 * lets each scene write the two or three styles that actually changed straight
 * to the DOM, and call `setState` only when something discrete happens, like a
 * programme entry becoming visible.
 *
 * `0` for any section not taller than the viewport — there is nothing to scroll
 * through, and the alternative is a division by zero.
 */
export function useScrollProgress(ref, onProgress) {
  // The latest callback, without re-subscribing the scroll listener every time
  // the parent re-renders and hands over a new closure.
  const callback = useRef(onProgress);

  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;
    let last = -1;

    const measure = () => {
      frame = 0;

      const { top, height } = element.getBoundingClientRect();
      const travel = height - window.innerHeight;
      const progress = travel <= 0 ? 0 : Math.min(1, Math.max(0, -top / travel));

      // Nothing downstream needs telling that a section which is already fully
      // scrolled past is still fully scrolled past. Most frames of a long page
      // are exactly that for two of the three scenes.
      if (progress === last) return;

      last = progress;
      callback.current(progress);
    };

    // One measurement per frame — scroll can fire many times between paints,
    // and each `getBoundingClientRect` would force a layout.
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    // Rotating a phone changes innerHeight, which is half of the arithmetic
    // above. Without this the scene stays frozen at whatever it measured in
    // portrait.
    window.addEventListener("resize", schedule);

    measure();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
}
