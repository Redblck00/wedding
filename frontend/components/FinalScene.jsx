"use client"

import { useRef } from "react"
import { useScrollProgress } from "@/hooks/useScrollProgress"

export default function FinalScene({
  imageSrc,
  coupleNames = "Amara & Ethan",
  date = "20 · 09 · 2026",
  subtitle = "Forever Starts Here",
}) {
  const ref = useRef(null)

  const p = useScrollProgress(ref)

  // Image expands from the center
  const clipH = 20 + p * 80

  // Text appears during the second half
  const textOpacity = Math.max(0, (p - 0.5) * 2)

  // Image slowly zooms out
  const imageScale = 1.1 - p * 0.08

  return (
    <section
      ref={ref}
      style={{
        height: "200vh",
        position: "relative",
      }}
    >
      {/* Sticky viewport */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: "#8b1a2e",
        }}
      >
        {/* ================================
            EXPANDING IMAGE
        ================================= */}
        <div
          style={{
            position: "absolute",
            inset: 0,

            clipPath: `
              inset(
                ${(100 - clipH) / 2}%
                ${(100 - clipH * 1.78) / 2}%
                ${(100 - clipH) / 2}%
                ${(100 - clipH * 1.78) / 2}%
              )
            `,

            transition: "clip-path 0.05s linear",
            willChange: "clip-path",
          }}
        >
          <img
            src={imageSrc}
            alt={coupleNames}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",

              transform: `scale(${imageScale})`,
              transition: "transform 0.05s linear",
              willChange: "transform",
            }}
          />

          {/* Image overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(26,10,16,0.1), rgba(139,26,46,0.6))",
            }}
          />
        </div>

        {/* ================================
            TEXT
        ================================= */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",

            paddingBottom: "8rem",
            textAlign: "center",

            opacity: textOpacity,
            transition: "opacity 0.1s linear",

            pointerEvents: "none",
          }}
        >
          {/* Subtitle */}
          <p
            className="font-serif-light italic text-white text-sm tracking-[0.35em] mb-5"
            style={{
              opacity: 0.65,
            }}
          >
            {subtitle}
          </p>

          {/* Couple names */}
          <h2
            className="font-display text-white"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
              letterSpacing: "0.12em",
              lineHeight: 1,
            }}
          >
            {coupleNames}
          </h2>

          {/* Date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: "1.5rem",
            }}
          >
            {/* Left line */}
            <div
              style={{
                width: 44,
                height: 1,
                background: "rgba(255,255,255,0.3)",
              }}
            />

            {/* Date */}
            <p
              className="font-serif-light text-white text-sm tracking-[0.45em]"
              style={{
                opacity: 0.6,
              }}
            >
              {date}
            </p>

            {/* Right line */}
            <div
              style={{
                width: 44,
                height: 1,
                background: "rgba(255,255,255,0.3)",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}