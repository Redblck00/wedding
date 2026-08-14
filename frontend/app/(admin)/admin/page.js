import Link from "next/link";

import LogoutButton from "@/components/logout-button";
import { requireAdmin } from "@/lib/dal";

export const metadata = {
  title: "Админ",
};

/**
 * Each card names the backend router that has to exist before the screen can do
 * anything. Until then this page is a map, not a console.
 */
const SECTIONS = [
  {
    title: "Загварууд",
    body: "Каталогийн загвар нэмэх, засах, идэвхгүй болгох.",
    api: "admin/templates.py",
  },
  {
    title: "Хэрэглэгчид",
    body: "Бүртгэлтэй хосуудын жагсаалт, эрхийн тохиргоо.",
    api: "admin/users.py",
  },
  {
    title: "Төлбөр",
    body: "Гүйлгээний түүх. Merchant гэрээ ороод эхэлнэ.",
    api: "admin/payments.py",
  },
];

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-shell/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-display text-xl tracking-wide">
              Хуримын урилга
            </Link>
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-ivory">Админ</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden text-sm text-muted transition-colors hover:text-ink sm:block"
            >
              Миний урилгууд
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <h1 className="font-display text-4xl font-light sm:text-5xl">Удирдлага</h1>
        <p className="mt-2 text-sm text-muted">{admin.email}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {SECTIONS.map((section) => (
            <article key={section.title} className="rounded-2xl border border-line bg-white/60 p-5">
              <h2 className="font-display text-xl">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
              <p className="mt-4 text-xs text-muted/70">Хүлээгдэж буй: {section.api}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
