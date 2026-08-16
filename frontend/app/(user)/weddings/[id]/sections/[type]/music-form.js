"use client";

import { useActionState } from "react";

import { saveSection } from "@/app/actions/sections";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";
import SavedNotice from "./saved-notice";

/**
 * The invitation's background track.
 *
 * YouTube only — the backend stores a video id and there are no audio uploads.
 * Leaving the field empty removes the music: the design renders no player at
 * all rather than an empty one.
 */
/** 75 -> "1:15". The stored value is seconds; nobody reads a song that way. */
function formatClock(seconds) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) return "";

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function MusicForm({ weddingId, sectionType, content }) {
  const [state, formAction, pending] = useActionState(saveSection, undefined);

  const saved = state?.values ?? content ?? {};

  // What the section already holds is a bare id, not the URL the couple pasted
  // — the backend strips it down on save. Showing the id back is honest but
  // unhelpful, so it is offered as a link they can check.
  const videoId = saved.youtube_video_id ?? "";
  const startAt = formatClock(saved.start_seconds);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="wedding_id" value={weddingId} />
      <input type="hidden" name="section_type" value={sectionType} />

      <SavedNotice state={state} />

      <FormField
        label="YouTube холбоос"
        name="youtube_video_id"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://youtu.be/..."
        defaultValue={videoId}
        hint="Хоосон орхивол хөгжим тоглохгүй."
      />

      {videoId ? (
        <p className="text-sm text-muted">
          Одоогийн бичлэг:{" "}
          <a
            // Carries the start with it, so "сонсох" opens the track at the
            // same place a guest will hear it begin — the quickest way to check
            // the offset is right.
            href={`https://www.youtube.com/watch?v=${videoId}${
              saved.start_seconds ? `&t=${saved.start_seconds}` : ""
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-4"
          >
            сонсох
          </a>
        </p>
      ) : null}

      <FormField
        label="Хаанаас эхлэх"
        name="start_seconds"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder="1:15"
        defaultValue={startAt}
        hint="Дуунаас эхлэх мөчийг 1:15 хэлбэрээр бичнэ. Хоосон бол эхнээс нь тоглоно. YouTube дээр хүссэн газраа зогсоод «Хуваалцах → Одоогийн цагаас эхлэх» сонголттой холбоосыг буулгавал энэ талбар өөрөө бөглөгдөнө."
      />

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="loop"
          defaultChecked={saved.loop ?? true}
          className="h-4 w-4"
        />
        Дуустал нь дахин эхлүүлэх
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="autoplay"
          defaultChecked={saved.autoplay ?? false}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          Дугтуй нээгдэхэд шууд эхлүүлэх
          <span className="mt-0.5 block text-sm text-muted">
            Зарим утсан дээр, ялангуяа iPhone дээр ажиллахгүй байж магадгүй. Тэр
            тохиолдолд зочин товчийг дарж эхлүүлнэ.
          </span>
        </span>
      </label>

      <div className="rounded-xl border border-line bg-shell/50 px-4 py-3 text-sm leading-relaxed text-muted">
        Урилгын баруун доод буланд жижиг товч үргэлж харагдана — зочин хөгжмийг
        хэдийд ч унтраах боломжтой. Хөтчүүд чимээг хэрэглэгчийн зөвшөөрөлгүйгээр
        эхлүүлэхийг хориглодог тул энэ товчийг авч болохгүй.
      </div>

      <SubmitButton pending={pending} pendingLabel="Хадгалж байна…">
        Хадгалах
      </SubmitButton>
    </form>
  );
}
