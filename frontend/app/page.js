import Link from "next/link";

import Photo from "@/components/photo";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { GALLERY_PHOTOS, HERO_PHOTO, TEMPLATE_PREVIEWS } from "@/lib/gallery";

export const metadata = {
  title: "Хуримын цахим урилга",
};

/**
 * The landing page.
 *
 * Reads nothing per-visitor, so it renders once at build time and is served
 * from the CDN. That is the point: this is the page a couple sees before they
 * trust the product, and it must not wait on a backend that may be asleep.
 */

const STEPS = [
  {
    n: "01",
    title: "Загвараа сонго",
    body: "Бэлэн загваруудаас өөрсдөдөө таарахыг нь сонгоод шууд эхэлнэ.",
  },
  {
    n: "02",
    title: "Мэдээллээ бөглө",
    body: "Нэр, огноо, байршил, зураг, хөгжим — бүгдийг нэг дороос засварлана.",
  },
  {
    n: "03",
    title: "QR-аар түгээ",
    body: "Урилгын холбоос болон QR код бэлэн. Зочид уншуулмагц урилга нээгдэнэ.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader overlay />

      <main className="flex-1">
        {/* ---------------------------------------------------------------- */}
        {/* Hero — styled as the invitation itself, not as a product banner.  */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative flex h-screen-safe items-center justify-center overflow-hidden">
          <Photo
            src={HERO_PHOTO}
            alt=""
            priority
            sizes="100vw"
            className="object-cover"
            placeholderClassName="absolute inset-0"
          />

          {/* Legibility scrim. Without it the names sit on whatever the
              photograph happens to be, which is unreadable on a bright sky. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/25 to-ink/60"
          />

          <div className="relative z-10 mx-auto max-w-2xl px-6 text-center text-ivory">
            <p className="text-xs uppercase tracking-[0.35em] sm:text-sm">Хамтдаа</p>

            <h1 className="mt-6 font-display text-5xl font-light leading-[1.05] sm:text-7xl">
              Бат
              <span className="mx-3 align-middle text-3xl text-rose-soft sm:mx-5 sm:text-5xl">
                &amp;
              </span>
              Сараа
            </h1>

            <div className="mx-auto mt-7 flex max-w-xs items-center gap-4 sm:mt-9">
              <span className="h-px flex-1 bg-ivory/40" />
              <span className="text-sm tracking-[0.2em] sm:text-base">2026.09.12</span>
              <span className="h-px flex-1 bg-ivory/40" />
            </div>

            <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-ivory/85 sm:text-base">
              Ийм урилгыг та хэдхэн минутад өөрийн нэр, зураг, огноогоор үүсгэж
              чадна.
            </p>

            <Link
              href="/register"
              // Full-width on a phone so it is reachable with a thumb, and
              // min-h-12 keeps it above the 44px touch-target floor.
              className="mt-9 inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-ivory px-8 text-sm font-medium text-ink transition-colors hover:bg-white sm:w-auto"
            >
              Үнэгүй эхлүүлэх
            </Link>
          </div>

          <div
            aria-hidden="true"
            className="absolute bottom-8 left-1/2 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-ivory/60"
          />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How it works                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-rose">Гурван алхам</p>
            <h2 className="mt-4 font-display text-3xl font-light sm:text-5xl">
              Урилгаа өөрөө бэлдэнэ
            </h2>
          </div>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((step) => (
              <li key={step.n} className="text-center sm:text-left">
                <span className="font-display text-4xl text-gold">{step.n}</span>
                <h3 className="mt-3 font-display text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Photographs                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-shell/50 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-light sm:text-5xl">
                Танай зургууд гол дүр
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                Урилга бүр өөрийн гэрэл зургаараа амилдаг. Утсанд хурдан нээгдэхээр
                зургийг автоматаар оновчилдог.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
              {GALLERY_PHOTOS.map((photo, index) => (
                <div
                  key={photo.src}
                  className={`relative overflow-hidden rounded-2xl ${
                    // The first photograph spans both columns on a phone: a
                    // 2-up grid of three items would otherwise leave a hole.
                    index === 0 ? "col-span-2 aspect-4/3 sm:col-span-1 sm:aspect-3/4" : "aspect-3/4"
                  }`}
                >
                  <Photo
                    src={photo.src}
                    alt={photo.alt}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    placeholderClassName="absolute inset-0"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Designs                                                           */}
        {/* ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-rose">Загварууд</p>
            <h2 className="mt-4 font-display text-3xl font-light sm:text-5xl">
              Бэлэн дизайнууд
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {TEMPLATE_PREVIEWS.map((template) => (
              <article key={template.src} className="group">
                <div className="relative aspect-3/4 overflow-hidden rounded-2xl border border-line">
                  <Photo
                    src={template.src}
                    alt={`${template.name} загвар`}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    placeholderClassName="absolute inset-0"
                  />
                </div>
                <div className="mt-4 flex items-baseline gap-3">
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${template.accent}`} />
                  <h3 className="font-display text-xl">{template.name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted">{template.note}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Closing call to action                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-line px-5 py-20 text-center sm:px-8 sm:py-28">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-light sm:text-5xl">
            Өнөөдөр эхлээд, өнөөдрөө түгээ
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            Бүртгүүлэхэд төлбөр шаардахгүй. Урилгаа бэлдээд, бэлэн болмогц нийтэлнэ.
          </p>
          <Link
            href="/register"
            className="mt-9 inline-flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-rose px-8 text-sm font-medium text-ivory transition-colors hover:bg-rose/90 sm:w-auto"
          >
            Үнэгүй бүртгүүлэх
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
