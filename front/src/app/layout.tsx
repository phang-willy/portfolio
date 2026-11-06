import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/providers/theme-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { HomeLocaleRedirect } from "@/features/i18n/components/home-locale-redirect";
import { LOCALE_COOKIE_NAME } from "@/features/i18n/lib/locale-cookie";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { appName } from "@/lib/app-name";
import { getSiteBaseUrl } from "@/lib/site-base-url";
import { Roboto, Oswald } from "next/font/google";
import { GoogleTagManager } from "@/components/analytics/google-tag-manager";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  metadataBase: getSiteBaseUrl(),
  title: `${appName} - Portfolio - Développeur Full Stack`,
  description: `${appName} - Portfolio - Développeur Full Stack`,
  icons: {
    icon: "/logo.ico",
  },
  openGraph: {
    title: `${appName} - Portfolio - Développeur Full Stack`,
    description: `${appName} - Portfolio - Développeur Full Stack`,
    ...openGraphLocaleFields("fr"),
  },
  ...(process.env.SITE_NOINDEX === "true"
    ? { robots: { index: false, follow: false } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${roboto.variable} ${oswald.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col relative">
        <GoogleTagManager />
        <HomeLocaleRedirect />
        <Script id="pathname-html-lang" strategy="beforeInteractive">
          {`(()=>{var p=location.pathname;var en=p==='/en'||p.startsWith('/en/');document.documentElement.lang=en?'en':'fr';if(p!=='/'&&p!=='')return;var prefix='${LOCALE_COOKIE_NAME}=';var parts=document.cookie?document.cookie.split('; '):[];for(var i=0;i<parts.length;i++){if(parts[i].indexOf(prefix)!==0)continue;try{var value=decodeURIComponent(parts[i].slice(prefix.length)).trim().toLowerCase();if(value==='en')location.replace('/en'+location.search+location.hash);}catch(e){}return;}})()`}
        </Script>
        <ThemeProvider>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
