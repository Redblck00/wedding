"use client";

import { useActionState } from "react";

import { register } from "@/app/actions/auth";
import FormField from "@/components/form-field";
import SubmitButton from "@/components/submit-button";
import { FIELD_LIMITS } from "@/lib/validation";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, undefined);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state?.message ? (
        <p
          role="alert"
          className="rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
        >
          {state.message}
        </p>
      ) : null}

      <FormField
        label="Нэр"
        name="full_name"
        autoComplete="name"
        placeholder="Бат-Эрдэнэ"
        defaultValue={state?.values?.full_name ?? ""}
        error={state?.errors?.full_name}
      />

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
        label="Утас"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+976 99xxxxxx"
        defaultValue={state?.values?.phone ?? ""}
        error={state?.errors?.phone}
      />

      <FormField
        label="Нууц үг"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        error={state?.errors?.password}
        hint={`Дор хаяж ${FIELD_LIMITS.passwordMin} тэмдэгт.`}
      />

      <SubmitButton pending={pending} pendingLabel="Бүртгэж байна…">
        Бүртгүүлэх
      </SubmitButton>
    </form>
  );
}
