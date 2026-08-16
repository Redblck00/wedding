import { notFound } from "next/navigation";

import { demoInvitation } from "@/templates/demo-invitation";
import { InvitationTemplate, availableTemplateCodes, hasTemplate } from "@/templates/registry";

/**
 * Full-screen preview of a design, filled with sample content.
 *
 * Reads nothing from the backend: the catalogue row carries a name and a price,
 * but what a design *looks* like lives entirely in this build. That also means
 * the preview keeps working while the API is asleep.
 */
export async function generateStaticParams() {
  return availableTemplateCodes().map((code) => ({ code }));
}

export async function generateMetadata({ params }) {
  const { code } = await params;
  return { title: `${code} — урьдчилан үзэх` };
}

export default async function TemplatePreviewPage({ params }) {
  // `params` is a Promise in Next 16 — synchronous access was removed.
  const { code } = await params;

  if (!hasTemplate(code)) notFound();

  // `preview` disables the RSVP form. Without it, tapping "send" in the gallery
  // would file a reply against the demo slug on somebody's real backend.
  return <InvitationTemplate code={code} invitation={demoInvitation()} preview />;
}
