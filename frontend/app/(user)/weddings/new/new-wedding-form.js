"use client";

import { useActionState, useState } from "react";

import { createWedding } from "@/app/actions/weddings";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";
import { SLUG_LIMITS } from "@/lib/validation";

export default function NewWeddingForm({ templateId, initialSlug = "" }) {
  const [state, formAction, pending] = useActionState(createWedding, undefined);

  // Mirrored into state only to show the URL as it is typed. The couple sees
  // this address before it is printed on anything, and a QR code cannot be
  // recalled — so it is worth making the result obvious while it is still free
  // to change.
  const [slug, setSlug] = useState(state?.values?.slug ?? initialSlug);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="template_id" value={templateId} />

      {state?.message ? (
        <p
          role="alert"
          className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Сүйт бүсгүйн нэр"
          name="bride_name"
          autoComplete="off"
          placeholder="Сарнай"
          defaultValue={state?.values?.bride_name ?? ""}
          error={state?.errors?.bride_name}
        />

        <FormField
          label="Хүргэний нэр"
          name="groom_name"
          autoComplete="off"
          placeholder="Болд"
          defaultValue={state?.values?.groom_name ?? ""}
          error={state?.errors?.groom_name}
        />
      </div>

      <FormField
        label="Хуримын өдөр"
        name="wedding_date"
        type="date"
        defaultValue={state?.values?.wedding_date ?? ""}
        error={state?.errors?.wedding_date}
        hint="Дараа нь өөрчилж болно."
      />

      <div>
        <FormField
          label="Урилгын хаяг"
          name="slug"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={SLUG_LIMITS.max}
          placeholder="sarnai-bold"
          value={slug}
          onChange={(event) => setSlug(event.target.value.toLowerCase())}
          error={state?.errors?.slug}
          hint="Латин жижиг үсэг, тоо, дундуур зураас."
        />

        {slug && !state?.errors?.slug ? (
          <p className="mt-2 truncate text-sm text-muted">
            Зочид энэ хаягаар нээнэ: <span className="text-ink">/wedding/{slug}</span>
          </p>
        ) : null}

        <p className="mt-2 text-sm text-muted">
          ⚠ Энэ хаягийг сольсон тохиолдолд тараасан QR код, линк бүгд ажиллахаа болино.
        </p>
      </div>

      <SubmitButton pending={pending} pendingLabel="Үүсгэж байна…">
        Урилга үүсгэх
      </SubmitButton>
    </form>
  );
}
