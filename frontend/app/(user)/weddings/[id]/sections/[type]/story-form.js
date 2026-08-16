"use client";

import { useActionState } from "react";

import { saveSection } from "@/app/actions/sections";
import SubmitButton from "@/components/submit-button";
import SavedNotice from "./saved-notice";

/**
 * The couple's own words, in the two places this design prints them: a short
 * introduction beside the section heading, and a quote set against the second
 * photograph.
 *
 * `StoryEntry` also holds a title, a date and a photo, and the design shows
 * none of them — so the form does not ask.
 */
export default function StoryForm({ weddingId, sectionType, content }) {
  const [state, formAction, pending] = useActionState(saveSection, undefined);

  const values = state?.values ?? content ?? {};
  const quote = values.entries?.[0]?.text ?? "";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="wedding_id" value={weddingId} />
      <input type="hidden" name="section_type" value={sectionType} />

      <SavedNotice state={state} />

      <Field
        label="Танилцуулга"
        name="intro"
        rows={3}
        defaultValue={values.intro ?? ""}
        placeholder="Хоёр хүнийг нэгтгэсэн мөчүүд, шинэ бүлгийн эхлэл."
        hint="Зургуудын дээр, гарчгийн хажууд харагдана."
      />

      <Field
        label="Ишлэл"
        name="quote"
        rows={3}
        defaultValue={quote}
        placeholder="Тэр өдрөөс хойш бүх дуу утгатай сонсогдох болсон."
        hint="Хоёр дахь зургийн хажууд налуугаар харагдана."
      />

      <SubmitButton pending={pending} pendingLabel="Хадгалж байна…">
        Хадгалах
      </SubmitButton>
    </form>
  );
}

function Field({ label, name, rows, defaultValue, placeholder, hint }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>

      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        // text-base stops iOS Safari zooming the page in on focus, which it
        // does for any input under 16px.
        className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-rose focus:ring-2 focus:ring-rose/30"
      />

      <span className="mt-1.5 block text-sm text-muted">{hint}</span>
    </label>
  );
}
