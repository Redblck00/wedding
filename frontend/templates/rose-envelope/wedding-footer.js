import IntroductionDecorations from "./introduction-decorations";
import Reveal from "./reveal";

/**
 * The closing details a guest scrolls back to — the date and who to call.
 *
 * No photograph and no programme here any more: `FinalScene` above it carries
 * the picture and `Timeline` carries the running order. Repeating either would
 * put the same content on the page twice.
 */
export default function WeddingFooter({ displayDate, brideName, groomName, phones }) {
  return (
    <footer className="relative overflow-hidden bg-[#F9E7EC] px-6 py-20 text-center">
      <IntroductionDecorations />

      {/* One wrapper rather than a lift on each line: the decorations are
          positioned and every one of these paragraphs is not, so without it they
          all paint underneath them. */}
      <div className="relative z-20">
        <Reveal>
          <p className="font-invite-display text-4xl text-[#694951]">{displayDate}</p>

          <p className="mt-6 mb-2 font-invite-serif text-[10px] uppercase tracking-[0.4em] text-[#A77B83]">
            Бидний хуримын өдөр
          </p>

             <p className="font-invite-display italic text-2xl text-[#795861]">
            Урьсан 
          </p>
          <div className="mx-auto mt-2 h-px w-20 bg-[#CFAAB2]" />
        </Reveal>


        <Reveal delay={300} className="mt-8">
          <p className="font-invite-display italic text-2xl text-[#795861]">
            Тантай хамт баярлахыг
            <br />
            тэсэн ядан хүлээж байна.
          </p>

      <p className="mt-10 font-invite-serif text-[9px] uppercase tracking-[0.4em] text-[#A77B83]">
            {brideName} & {groomName}
          </p>
           {phones?.length ? (
          <Reveal delay={150} className="mt-10">
            <div className="space-y-3 font-invite-serif text-sm text-[#795861]">
              {/* Phones live on the bride/groom sections as extra keys — the
                  schema allows unknown fields and preserves them, so no column
                  was needed. */}
              {phones.map((phone) => (
                <p key={phone}>
                  <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
                </p>
              ))}
            </div>
          </Reveal>
        ) : null}
        </Reveal>
      </div>
    </footer>
  );
}
