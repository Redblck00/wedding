"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";
import { hasErrors, validateWeddingCreate } from "@/lib/validation";

/**
 * Creates an invitation from a chosen design.
 *
 * The backend seeds the wedding's sections from the template's `template_content`
 * in the same transaction, so a successful call always lands on a wedding the
 * editor can open — never an empty one.
 *
 * Returns `{ errors, message, values }` for `useActionState`; `values` echoes
 * the form back so a rejected slug does not cost the couple everything else
 * they typed.
 */
export async function createWedding(_previousState, formData) {
  const values = {
    template_id: formData.get("template_id") ?? "",
    // Lowercased here as well as validated: people type a capital and the
    // pattern would reject it, which reads as the form being fussy rather than
    // as a rule about URLs.
    slug: (formData.get("slug") ?? "").trim().toLowerCase(),
    bride_name: (formData.get("bride_name") ?? "").trim(),
    groom_name: (formData.get("groom_name") ?? "").trim(),
    wedding_date: (formData.get("wedding_date") ?? "").trim(),
  };

  const errors = validateWeddingCreate(values);
  if (hasErrors(errors)) {
    return { errors, values };
  }

  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");

  const { ok, status, data, error } = await apiFetch("/weddings", {
    method: "POST",
    token,
    body: JSON.stringify({
      template_id: values.template_id,
      slug: values.slug,
      bride_name: values.bride_name,
      groom_name: values.groom_name,
      // The column is nullable and the couple may not have set a date yet.
      // An empty string is not a date and the backend would 422 on it.
      wedding_date: values.wedding_date || null,
    }),
  });

  if (!ok) {
    // 409 is about one field, and it is the one field the couple cannot simply
    // retry — it belongs under the input rather than in a form-wide banner.
    if (status === 409) {
      return { errors: { slug: "Энэ хаяг аль хэдийн ашиглагдсан байна." }, values };
    }
    return { message: error, values };
  }

  // `redirect` works by throwing, so it must be the last thing the action does
  // and its error must never be caught.
  redirect(`/weddings/${data.id}`);
}

/**
 * Publishes an invitation, or reports what is stopping it.
 *
 * The backend answers 422 with every blocker in one `detail` string — missing
 * required sections, too few photographs, no venue — already written as
 * sentences for the couple. Passing that through beats re-deriving the rules
 * here, where they would drift.
 */
export async function publishWedding(_previousState, formData) {
  const weddingId = formData.get("wedding_id");
  const intent = formData.get("intent") === "unpublish" ? "unpublish" : "publish";

  const token = await getAccessToken();
  if (!token) redirect("/login?next=/dashboard");

  const { ok, error } = await apiFetch(`/weddings/${weddingId}/${intent}`, {
    method: "POST",
    token,
  });

  if (!ok) return { message: error };

  // The overview and the dashboard both show the status, and neither is
  // fetched through the Data Cache — this clears the client router cache so
  // the couple does not navigate back to a stale badge.
  revalidatePath("/dashboard");
  revalidatePath(`/weddings/${weddingId}`);

  return { ok: true };
}
