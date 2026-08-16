"use client";

import { useEffect, useState } from "react";

/**
 * How far a tall section has travelled through the viewport, 0 → 1.
 *
 * 0 when its top reaches the top of the screen, 1 when its bottom leaves. Meant
 * for the `height: 200vh` + `position: sticky` pattern the scroll-driven scenes
 * use: the sticky child stays put while this drives what it draws.
 *
 * Returns 0 for any section not taller than the viewport — there is nothing to
 * scroll through, and the alternative is a division by zero.
 */
export function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      const element = ref.current;
      if (!element) return;

      const { top, height } = element.getBoundingClientRect();
      const travel = height - window.innerHeight;

      setProgress(travel <= 0 ? 0 : Math.min(1, Math.max(0, -top / travel)));
    };

    // One measurement per frame — scroll can fire many times between paints,
    // and each getBoundingClientRect would force layout + a React re-render.
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

  return progress;
}
