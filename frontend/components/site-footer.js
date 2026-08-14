import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-shell/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-display text-lg text-ink">Хуримын урилга</p>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/login" className="transition-colors hover:text-ink">
            Нэвтрэх
          </Link>
          <Link href="/register" className="transition-colors hover:text-ink">
            Бүртгүүлэх
          </Link>
        </nav>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
