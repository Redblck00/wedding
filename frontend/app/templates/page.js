import Link from "next/link";
import Image from "next/image";

import { apiFetch } from "@/lib/api";
import { hasTemplate } from "@/templates/registry";

export const metadata = {
  title: "Загварууд",
};

/**
 * The public catalogue.
 *
 * Unauthenticated on purpose — the backend serves `GET /v1/templates` without a
 * token so the designs can be browsed before anyone signs up.
 */
export default async function TemplatesPage() {
  const { ok, data, error } = await apiFetch("/templates");
  const templates = ok && Array.isArray(data) ? data : [];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="font-display text-4xl font-light sm:text-5xl">Загварууд</h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
        Загвараа сонгоод өөрийн зураг, текстээ нэмээд урилгаа үүсгэнэ.
      </p>

      {!ok ? (
        <p className="mt-10 rounded-2xl border border-line bg-white/60 p-5 text-sm text-muted">
          {error}
        </p>
      ) : null}

      {ok && templates.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-line bg-white/50 p-8 text-center text-sm text-muted">
          Загвар хараахан нэмэгдээгүй байна.
        </p>
      ) : null}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template }) {
  // A catalogue row whose design this build does not ship yet. It still belongs
  // on the page — the couple can see it is coming — but it must not offer a
  // preview link that would render an empty page.
  const renderable = hasTemplate(template.code);

  // Not one big <Link> around everything: the card offers two different
  // destinations — see the design, or build on it — and nesting an anchor
  // inside an anchor is invalid HTML that browsers resolve unpredictably.
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white/60">
      <div className="relative aspect-[3/4] overflow-hidden bg-shell">
        {template.thumbnail_url ? (
          <Image
            src={template.thumbnail_url}
            alt={template.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex items-baseline justify-between gap-3 p-4">
        <div>
          <h2 className="font-display text-lg">{template.name}</h2>
          {template.category ? (
            <p className="mt-0.5 text-xs text-muted">{template.category.name}</p>
          ) : null}
        </div>

        <p className="shrink-0 text-sm">
          {template.is_free ? (
            <span className="text-sage">Үнэгүй</span>
          ) : (
            `${Number(template.price).toLocaleString("mn-MN")}₮`
          )}
        </p>
      </div>

      {renderable ? (
        <div className="mt-auto flex gap-2 border-t border-line p-3">
          <Link
            href={`/templates/${template.code}`}
            className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-line px-3 text-sm transition-colors hover:border-rose/40"
          >
            Үзэх
          </Link>
          {/* `/weddings` is signed-in only, so `proxy.js` sends a guest to the
              login form and back here afterwards. */}
          <Link
            href={`/weddings/new?template=${template.code}`}
            className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-rose px-3 text-sm font-medium text-ivory transition-colors hover:bg-rose/90"
          >
            Сонгох
          </Link>
        </div>
      ) : (
        <p className="mt-auto border-t border-line px-4 py-3 text-xs text-muted/70">Удахгүй</p>
      )}
    </article>
  );
}
