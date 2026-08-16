import Link from "next/link";
import { notFound } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { requireUser } from "@/lib/dal";
import NewWeddingForm from "./new-wedding-form";

export const metadata = {
  title: "Шинэ урилга",
};

/**
 * Step two of creating an invitation: the couple has picked a design on
 * `/templates`, and this asks for the handful of things `POST /v1/weddings`
 * needs. Everything else is filled in later, in the editor.
 *
 * The design arrives as `?template=<code>` rather than an id — a code is stable
 * across databases, so a link a couple bookmarked or shared still resolves.
 */
export default async function NewWeddingPage({ searchParams }) {
  await requireUser();

  // `searchParams` is a Promise in Next 16 — synchronous access was removed.
  const { template: code } = await searchParams;

  if (!code) notFound();

  // Resolved server-side so the form posts an id the backend will accept, and
  // so a stale or invented code fails here rather than as a 404 on submit.
  const { ok, data } = await apiFetch("/templates");
  const template = ok && Array.isArray(data) ? data.find((item) => item.code === code) : null;

  if (!template) notFound();

  return (
    <div className="mx-auto w-full max-w-xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <Link href="/templates" className="text-sm text-muted transition-colors hover:text-ink">
        ← Загвар солих
      </Link>

      <h1 className="mt-6 font-display text-4xl font-light sm:text-5xl">Шинэ урилга</h1>

      <p className="mt-2 text-sm text-muted">
        Сонгосон загвар: <span className="text-ink">{template.name}</span>
      </p>

      <div className="mt-10">
        <NewWeddingForm templateId={template.id} />
      </div>
    </div>
  );
}
