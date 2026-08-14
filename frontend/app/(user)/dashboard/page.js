import Link from "next/link";

import LogoutButton from "@/components/logout-button";
import { requireUser } from "@/lib/dal";

export const metadata = {
  title: "Миний урилгууд",
};

/**
 * Placeholder for the couple's area.
 *
 * The guard is `requireUser()`, not the layout and not `proxy.js`: it asks the
 * backend who the caller is, so a forged or stale cookie gets no further than
 * this line.
 */
export default async function DashboardPage() {
  const user = await requireUser();

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
        <p className="text-sm text-muted">Сайн байна уу,</p>
        <h1 className="mt-1 font-display text-4xl font-light sm:text-5xl">{user.full_name}</h1>

        <div className="mt-12 rounded-3xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
          <h2 className="font-display text-2xl">Урилга алга байна</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Загвар сонгож эхний урилгаа үүсгэнэ. Энэ хэсэг удахгүй нэмэгдэнэ.
          </p>
        </div>
      </main>
    </div>
  );
}
