"use client";

import { useActionState } from "react";

import { saveSection } from "@/app/actions/sections";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";
import SavedNotice from "./saved-notice";

/**
 * The bride's or groom's details.
 *
 * Only the two fields this design prints. `BrideInfoContent` also carries
 * `bio`, `parents` and `photo_url`, and rose-envelope renders none of them —
 * asking for them here would have the couple write things no guest ever sees,
 * which is the trap `gift_info` and `dress_code` were dropped from this
 * template to avoid.
 */
export default function PersonForm({ weddingId, sectionType, content, label }) {
  const [state, formAction, pending] = useActionState(saveSection, undefined);

  // The action echoes back what it saved; before the first submit fall back to
  // whatever the section already holds.
  const values = state?.values ?? content ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="wedding_id" value={weddingId} />
      <input type="hidden" name="section_type" value={sectionType} />

      <SavedNotice state={state} />

      <FormField
        label={label}
        name="name"
        autoComplete="off"
        maxLength={150}
        placeholder="Сарнай"
        defaultValue={values.name ?? ""}
        hint="Урилга дээр том харагдана."
      />

      <FormField
        label="Утасны дугаар"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        maxLength={20}
        placeholder="+976 9911 2233"
        defaultValue={values.phone ?? ""}
        hint="Урилгын төгсгөлд харагдана. Заавал биш."
      />

      <SubmitButton pending={pending} pendingLabel="Хадгалж байна…">
        Хадгалах
      </SubmitButton>
    </form>
  );
}
