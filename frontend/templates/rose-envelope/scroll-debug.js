"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * TEMPORARY diagnostic overlay. Delete once the scroll question is settled.
 *
 * Answers one question a phone cannot otherwise be asked: when a finger drags
 * the page, how many pixels does the page scroll per pixel of finger?
 *
 * A native touch drag is 1.00 — the content stays under the finger. Anything
 * well above that means something is adding scroll on top of the browser's own
 * (a nested scroller chaining into the page, a scroll handler calling
 * `scrollBy`, a transformed ancestor), and anything below means something is
 * eating it. If the ratio is 1.00 and the page still *feels* fast, the scroll
 * is innocent and what is moving too fast is what the scroll is driving —
 * the gallery track, a parallax — which the second block measures.
 *
 * Mount it inside the invitation and read it on the phone itself; remote
 * debugging a phone from Windows is only available for Android.
 */
export default function ScrollDebug() {
  /*
   * Off unless the URL asks for it: `?debug=scroll`. Read after mount, never
   * during render, so the server's HTML and the first client render agree and
   * nothing here can cause a hydration mismatch. That is what makes it safe to
   * leave wired into the template while the question is open — a guest opening
   * the invitation gets nothing.
   */
  const on = useSyncExternalStore(
    // Nothing to subscribe to — the query string does not change under us.
    () => () => {},
    () => new URLSearchParams(window.location.search).get("debug") === "scroll",
    () => false,
  );

  // Written every frame, read once a frame — state here would re-render the
  // page we are trying to measure.
  const box = useRef(null);
  const gesture = useRef(null);
  const peak = useRef(0);
  const heights = useRef(new Set());

  useEffect(() => {
    if (!on) return;

    const write = (next) => {
      const node = box.current;
      if (!node) return;
      node.textContent = next;
    };

    let frame = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();

    const onTouchStart = (event) => {
      const touch = event.touches[0];
      gesture.current = {
        fingerFrom: touch.clientY,
        scrollFrom: window.scrollY,
        finger: 0,
        scrolled: 0,
      };
      peak.current = 0;
    };

    const onTouchMove = (event) => {
      const state = gesture.current;
      if (!state) return;
      const touch = event.touches[0];
      // Finger travel and page travel are opposite in sign: dragging up
      // (clientY decreasing) scrolls down (scrollY increasing).
      state.finger = state.fingerFrom - touch.clientY;
      state.scrolled = window.scrollY - state.scrollFrom;
    };

    const onTouchEnd = () => {
      // Kept on screen after the finger lifts so the numbers can be read.
      gesture.current = { ...gesture.current, done: true };
    };

    const tick = () => {
      frame = requestAnimationFrame(tick);

      const now = performance.now();
      const y = window.scrollY;
      const dt = now - lastT;
      // px per second — momentum after the finger lifts shows up here, not in
      // the ratio, because there is no finger left to compare against.
      const speed = dt > 0 ? Math.abs(y - lastY) / (dt / 1000) : 0;
      if (speed > peak.current) peak.current = speed;
      lastY = y;
      lastT = now;

      const docHeight = Math.round(document.documentElement.scrollHeight);
      heights.current.add(docHeight);

      const state = gesture.current ?? { finger: 0, scrolled: 0 };
      const ratio =
        Math.abs(state.finger) > 8 ? (state.scrolled / state.finger).toFixed(2) : "—";

      /*
       * The gallery is its own scroller now, so there is no gearing left to
       * report — what is worth watching instead is that it scrolls sideways
       * without the page moving underneath it, and that a vertical swipe over
       * it still reaches the page.
       */
      const strip = document.querySelector("[data-gallery-scroller]");
      const gallery = strip
        ? `x ${Math.round(strip.scrollLeft)} / ${Math.round(strip.scrollWidth - strip.clientWidth)}`
        : "—";

      write(
        [
          `scrollY ${Math.round(y)}  vh ${window.innerHeight}`,
          `finger ${Math.round(state.finger)}px → scroll ${Math.round(state.scrolled)}px`,
          `RATIO ${ratio}   (native = 1.00)`,
          `peak ${Math.round(peak.current)} px/s`,
          `docHeight ${docHeight}  seen ${heights.current.size} value(s)`,
          `gallery scrollLeft ${gallery}`,
        ].join("\n"),
      );
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [on]);

  if (!on) return null;

  return (
    <pre
      ref={box}
      onClick={() => {
        heights.current = new Set();
        peak.current = 0;
      }}
      style={{
        position: "fixed",
        left: 8,
        bottom: 8,
        zIndex: 9999,
        margin: 0,
        padding: "8px 10px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.78)",
        color: "#7CFFB2",
        font: "600 11px/1.45 ui-monospace, monospace",
        whiteSpace: "pre",
        pointerEvents: "auto",
      }}
    />
  );
}
