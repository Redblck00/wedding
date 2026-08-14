import Link from "next/link";

/**
 * The framing shared by the login and register pages.
 *
 * A single column even on a desktop: the couple signs up on the same phone they
 * were browsing on, and a two-column marketing split would push the form itself
 * below the fold on exactly that screen.
 */
export default function AuthShell({ title, intro, children, footer }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 py-6 sm:px-8">
        <Link href="/" className="font-display text-xl tracking-wide">
          Хуримын урилга
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-4 sm:items-center sm:px-8 sm:pb-24">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="font-display text-4xl font-light sm:text-5xl">{title}</h1>
            {intro ? <p className="mt-3 text-sm text-muted">{intro}</p> : null}
          </div>

          <div className="mt-9 rounded-3xl border border-line bg-white/70 p-6 shadow-sm sm:p-8">
            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
