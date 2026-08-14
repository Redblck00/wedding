import Link from "next/link";

/**
 * The landing page's header.
 *
 * Deliberately knows nothing about the visitor's session. Reading cookies here
 * would opt the whole home page out of static rendering, so every visit would
 * wait on the backend — and on Render's free tier that means the marketing page
 * inherits the cold start. Instead "Нэвтрэх" always shows: a signed-in user who
 * taps it is bounced straight to their dashboard by `proxy.js`.
 */
export default function SiteHeader({ overlay = false }) {
  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-20 text-ivory"
          : "border-b border-line bg-ivory/90 text-ink backdrop-blur"
      }
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-display text-xl tracking-wide sm:text-2xl">
          Хуримын урилга
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              overlay ? "hover:bg-white/15" : "hover:bg-shell"
            }`}
          >
            Нэвтрэх
          </Link>
          <Link
            href="/register"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              overlay
                ? "bg-ivory text-ink hover:bg-white"
                : "bg-rose text-ivory hover:bg-rose/90"
            }`}
          >
            Эхлэх
          </Link>
        </div>
      </nav>
    </header>
  );
}
