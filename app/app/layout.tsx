import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import AppHeader from "@/components/shell/AppHeader";

// self-hosted at build time by next/font: no request to Google at runtime (CSP stays closed)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Constellate",
  description: "An evidence-graded map of rare diseases, organised by shared genes and phenotypes instead of names.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0f1e" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
};

// set the stored theme before first paint, so a dark choice never flashes light
const themeScript = `var t="dark";try{if(localStorage.getItem("constellate.theme")==="light")t="light"}catch(e){}document.documentElement.setAttribute("data-theme",t)`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[12px] focus:bg-surface focus:px-4 focus:py-3">
            Skip to content
          </a>
          <AppHeader />
          <main id="main" className="w-full">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
