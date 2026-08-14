"use client";

import { useActionState } from "react";

import { login } from "@/app/actions/auth";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";

export default function LoginForm({ next }) {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Where to go after signing in. Sanitised server-side in the action —
          this value arrived from the query string and is not to be trusted. */}
      <input type="hidden" name="next" value={next ?? ""} />

      {state?.message ? (
        // role="alert" so the failure is announced; a silently reddened box is
        // invisible to anyone not looking straight at it.
        <p
          role="alert"
          className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
        >
          {state.message}
        </p>
      ) : null}

      <FormField
        label="Имэйл"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="tanii@mail.mn"
        defaultValue={state?.values?.email ?? ""}
        error={state?.errors?.email}
      />

      <FormField
        label="Нууц үг"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        error={state?.errors?.password}
      />

      <SubmitButton pending={pending} pendingLabel="Нэвтэрч байна…">
        Нэвтрэх
      </SubmitButton>
    </form>
  );
}
