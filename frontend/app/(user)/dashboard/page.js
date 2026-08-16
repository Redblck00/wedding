import Link from "next/link";

import LogoutButton from "@/components/logout-button";
import { requireUser } from "@/lib/dal";
import { getMyWeddings } from "@/lib/weddings";

export const metadata = {
  title: "Миний урилгууд",
};

const STATUS = {
  draft: { label: "Ноорог", className: "bg-shell text-muted" },
  published: { label: "Нийтлэгдсэн", className: "bg-sage/15 text-sage" },
  unpublished: { label: "Нийтлэхээ больсон", className: "bg-gold/15 text-gold" },
};

export default async function DashboardPage() {
  // The guard is `requireUser()`, not the layout and not `proxy.js`: it asks the
  // backend who the caller is, so a forged or stale cookie gets no further.
  const user = await requireUser();
  const { ok, weddings, error } = await getMyWeddings();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-xl tracking-wide">
            Хуримын урилга
          </Link>
          <div className="flex items-center gap-3">
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="hidden text-sm text-muted transition-colors hover:text-ink sm:block"
              >
                Админ
              </Link>
            ) : null}
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Сайн байна уу,</p>
            <h1 className="mt-1 font-display text-4xl font-light sm:text-5xl">{user.full_name}</h1>
          </div>

          {weddings.length > 0 ? (
            <Link
              href="/templates"
              className="min-h-12 rounded-full bg-rose px-6 py-3 text-sm font-medium text-ivory transition-colors hover:bg-rose/90"
            >
              Шинэ урилга
            </Link>
          ) : null}
        </div>

        {!ok ? (
          <p
            role="alert"
            className="mt-10 rounded-xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose"
          >
            {error}
          </p>
        ) : weddings.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
            <h2 className="font-display text-2xl">Урилга алга байна</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Загвар сонгоод зураг, текстээ нэмвэл урилга бэлэн болно.
            </p>
            <Link
              href="/templates"
              className="mt-8 inline-block min-h-12 rounded-full bg-rose px-8 py-3 text-sm font-medium text-ivory transition-colors hover:bg-rose/90"
            >
              Загвар сонгох
            </Link>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {weddings.map((wedding) => (
              <WeddingRow key={wedding.id} wedding={wedding} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function WeddingRow({ wedding }) {
  const status = STATUS[wedding.status] ?? STATUS.draft;
  const names = [wedding.bride_name, wedding.groom_name].filter(Boolean).join(" & ");

  return (
    <li>
      <Link
        href={`/weddings/${wedding.id}`}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white/60 px-5 py-4 transition-colors hover:border-rose/40"
      >
        <div className="min-w-0">
          <p className="truncate font-display text-xl">{names || "Нэр оруулаагүй"}</p>
          <p className="mt-1 truncate text-sm text-muted">
            /wedding/{wedding.slug}
            {wedding.wedding_date ? ` · ${wedding.wedding_date}` : ""}
          </p>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${status.className}`}>
          {status.label}
        </span>
      </Link>
    </li>
  );
}
