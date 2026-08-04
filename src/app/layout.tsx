import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/providers";
import { WebVitalsReporter } from "@/components/performance";
import { rootMetadata } from "@/lib/seo/metadata";
import { THEME_STORAGE_KEY } from "@/config/preferences";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = rootMetadata;

const themeInitScript = `
(function(){
  try {
    // Base UI platform utils call navigator.userAgent.toLowerCase().
    // Some browsers/extensions leave userAgent undefined — guard before React loads.
    if (typeof navigator !== "undefined") {
      try {
        if (navigator.userAgent == null) {
          Object.defineProperty(navigator, "userAgent", {
            get: function () { return ""; },
            configurable: true
          });
        }
      } catch (e) {}
      try {
        if (navigator.platform == null) {
          Object.defineProperty(navigator, "platform", {
            get: function () { return ""; },
            configurable: true
          });
        }
      } catch (e) {}
    }

    var raw = localStorage.getItem("${THEME_STORAGE_KEY}");
    var mode = "system";
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state && parsed.state.mode) mode = parsed.state.mode;
    }
    var resolved = mode;
    if (mode === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    var root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
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
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <AppProviders>
          <WebVitalsReporter />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
