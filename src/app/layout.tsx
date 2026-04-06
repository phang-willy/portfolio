import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { getRequestLocale } from "@/features/i18n/lib/request-locale";
import { Roboto, Oswald } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

function getMetadataBase(): URL {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv);
    } catch {
      // ignore invalid URL
    }
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL("http://localhost:3000");
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    metadataBase: getMetadataBase(),
    title: `${process.env.APP_TITLE} - Portfolio - Développeur Full Stack`,
    description: `${process.env.APP_TITLE} - Portfolio - Développeur Full Stack`,
    icons: {
      icon: "/logo.ico",
    },
    openGraph: {
      title: `${process.env.APP_TITLE} - Portfolio - Développeur Full Stack`,
      description: `${process.env.APP_TITLE} - Portfolio - Développeur Full Stack`,
      ...openGraphLocaleFields(locale),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const htmlLang = locale === "en" ? "en" : "fr";

  return (
    <html
      lang={htmlLang}
      data-scroll-behavior="smooth"
      className={`h-full antialiased ${roboto.variable} ${oswald.variable}`}
    >
      <body className="min-h-dvh flex flex-col relative">
        <ThemeProvider>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
