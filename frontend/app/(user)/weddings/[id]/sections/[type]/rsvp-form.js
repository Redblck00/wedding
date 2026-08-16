"use client";

import { useActionState } from "react";

import { saveSection } from "@/app/actions/sections";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";
import SavedNotice from "./saved-notice";

/**
 * The wording of the reply form guests fill in.
 *
 * Every field here is printed by the design — unlike most sections, nothing in
 * `RsvpFormContent` goes unused.
 *
 * What the couple cannot change is that replies are anonymous and a guest may
 * send more than one. That is deliberate in the backend and explained there:
 * any rule strict enough to enforce one reply per person turns real guests away
 * on a carrier that shares addresses.
 */
export default function RsvpForm({ weddingId, sectionType, content }) {
  const [state, formAction, pending] = useActionState(saveSection, undefined);

  const values = state?.values ?? content ?? {};

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="wedding_id" value={weddingId} />
      <input type="hidden" name="section_type" value={sectionType} />

      <SavedNotice state={state} />

      <label className="block">
        <span className="block text-sm font-medium">Урих үг</span>
        <textarea
          name="heading"
          rows={2}
          maxLength={300}
          defaultValue={values.heading ?? ""}
          placeholder="Та бидэнтэй хамт байх уу?"
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-rose focus:ring-2 focus:ring-rose/30"
        />
        <span className="mt-1.5 block text-sm text-muted">RSVP гарчгийн доор харагдана.</span>
      </label>

      <FormField
        label="Хариулах эцсийн хугацаа"
        name="deadline"
        type="date"
        defaultValue={values.deadline ?? ""}
        hint="Заавал биш. Оруулбал зочдод сануулга харагдана."
      />

      <FormField
        label="Нэмэлт асуулт"
        name="custom_question"
        maxLength={150}
        defaultValue={values.custom_question ?? ""}
        placeholder="Захиас"
        hint="Захиасны талбарын нэрийг сольж болно."
      />

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="ask_guest_count"
          defaultChecked={values.ask_guest_count ?? true}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          Хэдүүлээ ирэхийг асуух
          <span className="mt-0.5 block text-sm text-muted">
            Ирэхгүй гэсэн зочноос асуухгүй — тоо нь 0 болж бүртгэгдэнэ.
          </span>
        </span>
      </label>

      <SubmitButton pending={pending} pendingLabel="Хадгалж байна…">
        Хадгалах
      </SubmitButton>
    </form>
  );
}
