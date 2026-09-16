import type { Metadata } from "next";
import { Jua, Noto_Sans_KR } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const display = Jua({
  variable: "--font-display-kr",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aniimo-wiki.example"),
  title: {
    default: "애니모 위키 · Aniimo Fan Wiki",
    template: "%s · 애니모 위키",
  },
  description:
    "한국 우선 애니모(Aniimo) 팬 위키. 에이델/Idyll 월드, 애니모 도감, 시스템, 지도, 육성 시뮬레이터. 출처와 신뢰도를 함께 표기합니다.",
  icons: {
    icon: "/art/crest.jpg",
  },
  openGraph: {
    title: "애니모 위키 · Aniimo Fan Wiki",
    description: "한국 우선 애니모 팬 위키 — 월드, 도감, 시스템, 지도, 육성 시뮬.",
    images: ["/art/hero-idyll.jpg"],
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <div className="site-aurora" aria-hidden />
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
