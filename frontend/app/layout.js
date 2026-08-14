import { Cormorant_Garamond, Inter } from "next/font/google";

import "./globals.css";

/**
 * Both faces load the Cyrillic subset explicitly. Without it the browser falls
 * back to a system font the moment a Mongolian name appears, so the site would
 * look right in the design and wrong with real content.
 */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "Хуримын урилга",
    template: "%s · Хуримын урилга",
  },
  description:
    "Хуримын цахим урилгаа хэдхэн минутад бэлдээд, QR кодоор зочиддоо тараана. Утсанд тохирсон, үнэгүй эхлүүлнэ.",
};

export const viewport = {
  themeColor: "#fdfaf5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn" className={`${cormorant.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
