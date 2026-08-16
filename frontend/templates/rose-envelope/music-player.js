"use client";

import { useState } from "react";

/**
 * Background music, as a small floating toggle over the invitation.
 *
 * The backend stores a bare YouTube video id (it parses whatever URL the couple
 * pasted), and nothing else — there are no audio uploads.
 *
 * `autoplay` starts it as soon as the invitation opens. That is allowed
 * because the guest reached this point by *tapping the envelope* — browsers
 * refuse sound without a user activation, and that tap is one. Chrome keeps
 * the activation for the life of the page, so the mount below inherits it.
 *
 * It is not guaranteed. Safari on iOS wants `play()` close to the gesture, and
 * the chain here — tap, state change, re-render, iframe load, YouTube's own
 * startup — can outrun that window. A blocked autoplay is invisible to a bare
 * iframe, so the button will read as playing while nothing does; tapping it
 * twice recovers, because the second mount comes straight off a tap. Worth the
 * trade only because the couple opted in.
 *
 * The toggle always stays: a guest who did not want sound must be able to stop
 * it, which is the whole reason the autoplay policy exists.
 *
 * Must be rendered outside any ancestor that sets `filter` or `transform` —
 * either makes that ancestor the containing block for `position: fixed`, and
 * this button would anchor to it instead of the viewport.
 */
export default function MusicPlayer({ videoId, loop, autoplay = false, startSeconds = 0 }) {
  // Safe to seed from a prop: this component is only mounted once the envelope
  // has been opened, which never happens during the server render — so there is
  // no HTML for a `true` here to disagree with.
  const [playing, setPlaying] = useState(autoplay);

  if (!videoId) return null;

  /*
   * `start` is what skips the intro — the couple picks the bar the song should
   * come in on, usually the chorus, and a guest never sits through thirty
   * seconds of nothing while reading the invitation.
   *
   * Omitted entirely at zero rather than sent as `start=0`: the two mean the
   * same thing to YouTube, and a URL that carries only what was asked for is
   * one less thing to read when this misbehaves.
   *
   * Whether the offset survives a `loop` repeat is YouTube's call, not ours —
   * the loop is the `playlist` trick below, which restarts the video through
   * the player rather than by reloading this iframe. Worth watching if a couple
   * reports the second play-through starting from the top.
   */
  const source =
    `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` +
    `?autoplay=1&loop=${loop ? 1 : 0}&playlist=${encodeURIComponent(videoId)}` +
    (startSeconds > 0 ? `&start=${Math.floor(startSeconds)}` : "");

  return (
    <div
      // `max(…, env(safe-area-inset-bottom))` keeps the button clear of the
      // iPhone home indicator without pushing it up on every other device.
      className="fixed right-5 z-50 bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      {playing ? (
        // Soft ring while the music runs — the only cue that the toggle is on,
        // short of unmuting. `animate-ping` is a Tailwind default, so this costs
        // no JavaScript.
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full border border-[#CFAAB2] opacity-60"
        />
      ) : null}

      <button
        type="button"
        onClick={() => setPlaying((value) => !value)}
        aria-pressed={playing}
        aria-label={playing ? "Хөгжим унтраах" : "Хөгжим тоглуулах"}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#CFAAB2] bg-white/80 text-[#795861] shadow-lg backdrop-blur transition hover:bg-white"
      >
        {playing ? <PauseIcon /> : <NoteIcon />}
      </button>

      {playing ? (
        // `loop` needs `playlist` set to the same id — YouTube ignores it on a
        // single video otherwise. Kept a pixel wide rather than hidden with
        // `display: none`, which stops playback in some browsers.
        <iframe
          src={source}
          allow="autoplay"
          title="Дэвсгэр хөгжим"
          className="pointer-events-none absolute h-px w-px opacity-0"
        />
      ) : null}
    </div>
  );
}

/* Inline SVG rather than the ♪ and ❙❙ characters: those fall back to a system
   font that varies by device, and the pause glyph renders as tofu on several
   Android builds. */

function NoteIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="h-5 w-5"
    >
      <path d="M9 5v14M15 5v14" />
    </svg>
  );
}
