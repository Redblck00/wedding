import { Cormorant_Garamond, Jost, Playfair_Display } from "next/font/google";

/**
 * Invitation typefaces — same trio as weddingTemplateFigma:
 *
 * - Playfair Display → titles & couple names (`font-invite-display`)
 * - Cormorant Garamond → labels, subtitles, body copy (`font-invite-serif`)
 * - Jost → UI / forms / small tracking labels (`font-invitation`)
 *
 * Loaded here rather than in the root layout so the dashboard keeps Cormorant
 * + Inter, and a guest who only opens an invitation still gets the full set.
 *
 * `cyrillic` is required on every face. Without it the browser falls back to a
 * system font the moment a Mongolian name appears.
 */

export const playfair = Playfair_Display({
  subsets: ["cyrillic", "latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-invite-playfair",
});

export const cormorantInvite = Cormorant_Garamond({
  subsets: ["cyrillic", "latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-invite-cormorant",
});

export const jost = Jost({
  subsets: ["cyrillic", "latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-jost",
});
