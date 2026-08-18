"use client";

import { useEffect, useRef, useState } from "react";

/**
 * YouTube's iframe API, loaded once per page however many players ask for it.
 *
 * The API is a global with a global callback — `onYouTubeIframeAPIReady` — so
 * two components racing to add the script would each install a callback and one
 * would lose. A single promise, cached in the module, is what makes it safe to
 * call from anywhere.
 */
let apiPromise = null;

function loadPlayerApi() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiPromise;
}

/** How long to wait for a play attempt before treating silence as a refusal. */
const REFUSAL_MS = 1200;

/**
 * Background music, as a small floating toggle over the invitation.
 *
 * The backend stores a bare YouTube video id (it parses whatever URL the couple
 * pasted), and nothing else — there are no audio uploads.
 *
 * This is the iframe *API*, not a bare `<iframe src="…&autoplay=1">`, and the
 * reason is the bug that replaced it: a bare iframe cannot be asked whether it
 * is playing. The old toggle showed a pause icon and a pulsing ring the moment
 * it mounted the iframe, so a guest whose browser had quietly refused the sound
 * was told the music was on while nothing played — which is the one failure
 * that leaves them with nothing to try.
 *
 * That refusal is the normal case, not the edge case, and a QR code is how a
 * guest finds it. Scanning one usually opens the invitation in an in-app
 * browser — a camera app's, Messenger's, Instagram's — and those, along with
 * Safari on iOS, will not start audible media without a user activation *in the
 * frame that plays it*. The envelope tap is an activation in the page, and a
 * cross-origin YouTube frame does not inherit it. Nothing written here can
 * change that; what it can do is find out, and offer the tap that fixes it.
 *
 * So playback is attempted in three stages, each one a step further from what
 * the couple asked for and a step closer to something a browser will allow:
 *
 *   1. Play with sound. This is what a desktop and most Android browsers give.
 *   2. If nothing is playing a beat later, mute and play again. Muted autoplay
 *      is permitted almost everywhere audible autoplay is not, so the song is
 *      running and in time — it simply cannot be heard yet. The button says so
 *      and one tap unmutes it, because that tap is the activation that was
 *      missing.
 *   3. If even that is refused, the button says the music is off, and tapping
 *      it starts playback from a real gesture.
 *
 * The toggle always stays: a guest who did not want sound must be able to stop
 * it, which is the whole reason the autoplay policy exists.
 *
 * Must be rendered outside any ancestor that sets `filter` or `transform` —
 * either makes that ancestor the containing block for `position: fixed`, and
 * this button would anchor to it instead of the viewport.
 */
export default function MusicPlayer({ videoId, loop, autoplay = false, startSeconds = 0 }) {
  /*
   * Whether a player should exist at all.
   *
   * Seeded from `autoplay` and never lowered again: pausing keeps the player so
   * the toggle answers instantly and the song resumes where it stopped. For a
   * couple who did not ask for autoplay, nothing is fetched until the first tap
   * — the YouTube API and the video are about a third of a megabyte, and on a
   * phone data plan that is not a thing to spend on music nobody asked to hear.
   *
   * Safe to seed from a prop: this component is only mounted once the envelope
   * has been opened, which never happens during the server render, so there is
   * no HTML for a `true` here to disagree with.
   */
  const [wanted, setWanted] = useState(autoplay);

  /*
   * What is actually happening, as opposed to what was asked for:
   *
   *   "off"      — no player, or paused. The button offers to start it.
   *   "starting" — asked to play, nothing has come back yet.
   *   "playing"  — playing, audibly.
   *   "muted"    — playing, silently, because sound was refused. One tap fixes.
   *   "blocked"  — refused outright. A tap is a gesture, so a tap may not be.
   */
  const [status, setStatus] = useState(autoplay ? "starting" : "off");

  const holder = useRef(null);
  const player = useRef(null);

  useEffect(() => {
    // Read once, here: the cleanup below runs after the node may already have
    // been detached, and `holder.current` would be `null` by then.
    const box = holder.current;
    if (!videoId || !wanted || !box) return;

    let cancelled = false;
    let rescue = 0;

    loadPlayerApi().then((YT) => {
      if (cancelled) return;

      /*
       * A node of its own, created here rather than rendered.
       *
       * `YT.Player` *replaces* the element it is given with the iframe it
       * builds, and an element React rendered is one React expects to still be
       * there at the next commit. Handing it a node React has never seen keeps
       * the two out of each other's way.
       */
      const mount = document.createElement("div");
      box.appendChild(mount);

      const attempt = (target) => {
        target.playVideo();

        /*
         * A browser refusing sound refuses it silently — no error, no event,
         * the player simply never leaves `UNSTARTED`. There is nothing to
         * catch, so the refusal has to be *timed*.
         */
        rescue = window.setTimeout(() => {
          if (cancelled || target.getPlayerState() === YT.PlayerState.PLAYING) return;

          target.mute();
          target.playVideo();

          rescue = window.setTimeout(() => {
            if (cancelled) return;
            setStatus(
              target.getPlayerState() === YT.PlayerState.PLAYING ? "muted" : "blocked",
            );
          }, REFUSAL_MS);
        }, REFUSAL_MS);
      };

      player.current = new YT.Player(mount, {
        videoId,
        // The no-cookie host, as before: a guest who never asked for music
        // should not collect a YouTube cookie for hearing it.
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          // `playsinline` is not cosmetic on iOS. Without it the phone hands
          // the video to the fullscreen native player, which takes over the
          // screen and cannot start without a tap of its own — an invitation
          // that opens into a black video player is worse than a silent one.
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          /*
           * `loop` needs `playlist` set to the same id — YouTube ignores it on
           * a single video otherwise.
           */
          loop: loop ? 1 : 0,
          playlist: loop ? videoId : undefined,
          /*
           * `start` is what skips the intro: the couple picks the bar the song
           * should come in on, usually the chorus, so a guest never sits
           * through thirty seconds of nothing while reading the invitation.
           * Omitted at zero rather than sent as `start=0` — they mean the same
           * thing to YouTube, and a URL carrying only what was asked for is one
           * less thing to read when this misbehaves.
           */
          start: startSeconds > 0 ? Math.floor(startSeconds) : undefined,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => attempt(event.target),
          onStateChange: (event) => {
            if (cancelled) return;

            if (event.data === YT.PlayerState.PLAYING) {
              // The one place both halves of the question are answered at once:
              // it is playing, and this is whether it can be heard.
              setStatus(event.target.isMuted() ? "muted" : "playing");
              return;
            }

            if (event.data === YT.PlayerState.PAUSED) setStatus("off");
            if (event.data === YT.PlayerState.ENDED && !loop) setStatus("off");
          },
          // A video the couple has since made private, or one blocked in the
          // guest's country. Nothing here can play it, and the button should
          // not claim otherwise.
          onError: () => {
            if (!cancelled) setStatus("blocked");
          },
        },
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(rescue);
      player.current?.destroy?.();
      player.current = null;
      box.textContent = "";
    };
  }, [videoId, wanted, loop, startSeconds]);

  if (!videoId) return null;

  const audible = status === "playing";
  // Playing but silent, or refused outright: either way the guest has something
  // to gain by tapping, and should be told so rather than left with an icon.
  const needsTap = status === "muted" || status === "blocked";

  const toggle = () => {
    const target = player.current;

    // First tap on an invitation whose couple did not ask for autoplay: there
    // is no player yet, and this gesture is what builds one.
    if (!wanted || typeof target?.playVideo !== "function") {
      setWanted(true);
      setStatus("starting");
      return;
    }

    if (audible) {
      target.pauseVideo();
      setStatus("off");
      return;
    }

    /*
     * Muted, blocked or paused, and the answer to all three is the same: this
     * click *is* a user activation, which is the currency every one of these
     * policies is denominated in.
     *
     * The state is read back rather than waited for. Unmuting a player that is
     * already `PLAYING` changes no player state, so `onStateChange` will not
     * fire and nothing would ever clear the "tap for sound" label.
     */
    target.unMute();
    target.setVolume(100);
    target.playVideo();

    const playing = window.YT?.PlayerState?.PLAYING ?? 1;
    setStatus(
      target.getPlayerState() === playing && !target.isMuted() ? "playing" : "starting",
    );
  };

  return (
    <div
      // `max(…, env(safe-area-inset-bottom))` keeps the button clear of the
      // iPhone home indicator without pushing it up on every other device.
      className="fixed right-5 z-50 bottom-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      {/*
        The player itself: a pixel of it, transparent and untappable. Kept at a
        real size rather than `display: none`, which stops playback outright in
        several browsers.
      */}
      <div ref={holder} aria-hidden className="pointer-events-none absolute h-px w-px opacity-0" />

      {audible ? (
        // Soft ring while the music runs — and only while it actually runs. The
        // ring used to appear the moment the iframe mounted, which is precisely
        // how a silent invitation came to look like a playing one.
        // `animate-ping` is a Tailwind default, so this costs no JavaScript.
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full border border-[#CFAAB2] opacity-60"
        />
      ) : null}

      {needsTap ? (
        <span
          aria-hidden
          className="pointer-events-none absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#CFAAB2] bg-white/95 px-3 py-1 font-invite-serif text-[10px] tracking-[0.15em] text-[#795861] shadow-md"
        >
          Дуу асаах
        </span>
      ) : null}

      <button
        type="button"
        onClick={toggle}
        aria-pressed={audible}
        aria-label={
          audible ? "Хөгжим унтраах" : needsTap ? "Хөгжмийн дуу асаах" : "Хөгжим тоглуулах"
        }
        // Opaque rather than `bg-white/80 backdrop-blur`. A backdrop filter has
        // to re-sample whatever is behind the element every time that changes,
        // and this one is `fixed` over the entire invitation — so on a phone it
        // was re-blurring a moving page on every frame of every scroll, for a
        // frosting effect on a 48px button nobody is looking at while scrolling.
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[#CFAAB2] bg-white/95 text-[#795861] shadow-lg transition hover:bg-white"
      >
        {audible ? <PauseIcon /> : needsTap ? <MutedIcon /> : <NoteIcon />}
      </button>
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

/** A crossed-out speaker: the music is running, the sound is not. */
function MutedIcon() {
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
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </svg>
  );
}
