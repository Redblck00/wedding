"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Decorative parallax layer that drifts with the pointer.
 *
 * Purely ornamental, so it is `pointer-events-none` and carries no text a
 * screen reader should announce.
 */
export default function FloatingFlowers() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const x = useSpring(mouseX, { stiffness: 35, damping: 20 });
  const y = useSpring(mouseY, { stiffness: 35, damping: 20 });

  // A second, lazier spring for one flower so the layer does not move as a
  // single rigid sheet. Hoisted rather than called inline in `style={{ … }}`:
  // a hook inside JSX breaks the rules-of-hooks lint and would re-subscribe on
  // any future conditional render.
  const slowX = useSpring(mouseX, { stiffness: 25 });
  const slowY = useSpring(mouseY, { stiffness: 25 });

  useEffect(() => {
    const handleMove = (clientX, clientY) => {
      mouseX.set((clientX / window.innerWidth - 0.5) * 18);
      mouseY.set((clientY / window.innerHeight - 0.5) * 18);
    };

    const handleMouseMove = (event) => handleMove(event.clientX, event.clientY);

    const handleTouchMove = (event) => {
      const touch = event.touches[0];
      // A touchend fires with an empty `touches` list; reading [0] blindly
      // throws and takes the whole invitation down with it.
      if (touch) handleMove(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <motion.div
        style={{ x, y }}
        className="absolute left-[8%] top-[15%] text-5xl text-[#C89EA8]/50"
      >
        ✿
      </motion.div>

      <motion.div
        style={{ x: slowX, y: slowY }}
        className="absolute right-[10%] top-[20%] text-4xl text-[#C89EA8]/40"
      >
        ❀
      </motion.div>

      <motion.div
        style={{ x, y }}
        className="absolute bottom-[18%] left-[12%] text-3xl text-[#C89EA8]/40"
      >
        ✾
      </motion.div>

      <motion.div
        style={{ x, y }}
        className="absolute bottom-[22%] right-[13%] text-5xl text-[#C89EA8]/40"
      >
        ❁
      </motion.div>

      <motion.div
        style={{ x, y }}
        className="absolute left-[25%] top-[10%] h-3 w-3 rounded-full bg-white/70"
      />

      <motion.div
        style={{ x, y }}
        className="absolute bottom-[15%] right-[25%] h-2 w-2 rounded-full bg-[#D9B8B8]/60"
      />

      <motion.div
        style={{ x, y }}
        className="absolute bottom-[30%] left-[18%] h-4 w-4 rotate-45 border border-[#C99DA6]/40"
      />

      <motion.div
        style={{ x, y }}
        className="absolute right-[20%] top-[35%] h-5 w-5 rounded-full border border-[#C99DA6]/30"
      />

      <motion.div style={{ x, y }} className="absolute left-[45%] top-[25%] text-xl text-white/70">
        ✦
      </motion.div>
    </div>
  );
}
