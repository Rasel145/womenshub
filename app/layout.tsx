import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Used only when the website is shown in Bangla
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bn",
  subsets: ["bengali"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WomensHub",
  description: "Your beauty, delivered.",
};

// Runs before the page is shown, so the saved theme and language apply without a flash
const initScript = `
(function () {
  try {
    var root = document.documentElement;
    if (localStorage.getItem("theme") === "dark") root.classList.add("dark");
    if (localStorage.getItem("lang") === "bn") {
      root.dataset.lang = "bn";
      root.lang = "bn";
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoBengali.variable} flex min-h-screen flex-col antialiased`}
      >
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}