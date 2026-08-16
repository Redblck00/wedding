/**
 * A filled-in invitation used to preview a design before anyone owns one.
 *
 * Shaped exactly like `buildInvitation()`'s output so a template cannot tell the
 * difference — a preview that took a different shape would let a design work in
 * the gallery and break on a real guest's page.
 *
 * The photographs are the ones already in `public/`, so previewing a template
 * costs no extra assets in the bundle.
 */

/** The wedding is always a comfortable way off, so the countdown never reads zero. */
function demoDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  // Local parts, not `toISOString()`: that converts to UTC first and can roll
  // the preview back a day for anyone east of Greenwich — which is everyone here.
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The real pixel dimensions of the files in `public/hurim/` — all four came off
 * the same camera. Carried rather than left null because designs now shape a
 * frame around each picture (`lib/images.js`), so a preview without them would
 * fall back to a default ratio and show a couple something the live page does
 * not do.
 */
const PHOTO_WIDTH = 4928;
const PHOTO_HEIGHT = 3264;

const PHOTOS = [
  "/hurim/_JAK8145.JPG",
  "/hurim/_JAK8040.JPG",
  "/hurim/_JAK8081.JPG",
  "/hurim/_JAK8096.JPG",
].map((url, index) => ({
  id: `demo-${index}`,
  url,
  thumbnailUrl: url,
  width: PHOTO_WIDTH,
  height: PHOTO_HEIGHT,
}));

export function demoInvitation() {
  const date = demoDate();
  const [year, month, day] = date.split("-");

  return {
    slug: "demo",
    brideName: "Сарнай",
    groomName: "Болд",

    startsAt: `${date}T17:00:00`,
    displayDate: `${day} · ${month} · ${year}`,

    bride: {
      name: "Сарнай",
      photoUrl: PHOTOS[0].url,
      bio: null,
      parents: null,
      phone: "+976 9911 2233",
    },
    groom: {
      name: "Болд",
      photoUrl: PHOTOS[1].url,
      bio: null,
      parents: null,
      phone: "+976 8811 4455",
    },

    story: {
      intro: "Хоёр хүнийг нэгтгэсэн мөчүүд, шинэ бүлгийн эхлэл.",
      entries: [{ text: "Тэр өдрөөс хойш бүх дуу утгатай сонсогдох болсон." }],
    },

    // Enough entries to show the timeline revealing itself entry by entry.
    schedule: [
      {
        title: "Зочид цугларах",
        startsAt: "16:00",
        endsAt: null,
        description: "Угтах ундаа, мэндчилгээ — ёслол эхлэхээс өмнөх тайван мөчүүд.",
      },
      {
        title: "Ёслолын ажиллагаа",
        startsAt: "17:00",
        endsAt: null,
        description: "Бид тангараг өргөж, шинэ амьдралаа эхлүүлэх мөч.",
      },
      {
        title: "Гэрэл зураг",
        startsAt: "18:00",
        endsAt: null,
        description: "Хайртай хүмүүстэйгээ дурсамжаа үлдээх цаг.",
      },
      {
        title: "Хүлээн авалт",
        startsAt: "19:00",
        endsAt: null,
        description: "Инээд хөөр, хөгжим дүүрэн дулаахан цуглаан.",
      },
      {
        title: "Оройн зоог",
        startsAt: "20:00",
        endsAt: null,
        description: "Амттай хоол, чин сэтгэлийн үг, мартагдашгүй мөчүүд.",
      },
    ],

    venueHeading: "Хаана болох вэ?",
    venueNote: "Бидний хамт байх газрууд",

    venues: [
      {
        id: "demo-venue-1",
        name: "Хуримын ордон",
        address: "Улаанбаатар, Сүхбаатар дүүрэг",
        startsAt: "17:00",
        photoUrl: PHOTOS[2].url,
        mapUrl: null,
        latitude: 47.918873,
        longitude: 106.917701,
      },
      {
        id: "demo-venue-2",
        name: "Сарнай ресторан",
        address: "Улаанбаатар, Чингэлтэй дүүрэг",
        startsAt: "19:00",
        photoUrl: PHOTOS[3].url,
        mapUrl: null,
        latitude: 47.9187,
        longitude: 106.9176,
      },
    ],

    // What `hero_media_id` resolves to. Pinned to a photo the reel does not open
    // with, so the preview shows the chosen-photo path rather than the fallback
    // to the first one.
    heroPhoto: PHOTOS[1],

    gallery: { layout: "grid", photos: PHOTOS },

    // Stored on the gallery section as extra keys in the real thing — see
    // `buildInvitation`. Pinned to the first photo here rather than letting it
    // fall back to the last, so the preview exercises the chosen-photo path.
    finalScene: {
      // Neither the first photo (which opens the reveal) nor the last (which is
      // what the real fallback picks) — so the preview shows a genuinely chosen
      // picture and no photograph appears twice on one page.
      photoUrl: PHOTOS[2].url,
      subtitle: "Мөнхийн эхлэл",
    },

    rsvp: {
      heading: "Энэ онцгой өдрийг тантай хамт өнгөрүүлэхийг хүсэж байна.",
      deadline: null,
      askGuestCount: true,
      customQuestion: null,
    },

    // A stand-in track so the floating player is visible in the preview — a
    // couple choosing a design should see every control it comes with.
    //
    // The null case is the one a template is most likely to get wrong, so check
    // it by hand after touching the player: with `music: null` the button must
    // not render at all, rather than opening an empty embed.
    // autoplay on, so the preview shows the design as a couple would actually
    // ship it. Nothing plays on page load: the catalogue preview opens on the
    // same envelope a guest taps, and the music only starts after that tap.
    // `startSeconds` carried even at 0, so this fixture keeps the same shape
    // `buildInvitation` returns — a template reading it must not find a number
    // live and `undefined` in the catalogue preview.
    music: { youtubeVideoId: "jfKfPfyJRdk", startSeconds: 0, autoplay: true, loop: true },

    gift: { message: null, accounts: [] },
    dressCode: { description: null, colors: [], referenceImageUrl: null },
  };
}
