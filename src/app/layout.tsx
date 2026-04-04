import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { MainLayout } from "@/components/layout/main-layout";
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
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();
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

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: `${process.env.APP_TITLE} - Portfolio - Développeur Full Stack`,
  description: `${process.env.APP_TITLE} - Portfolio - Développeur Full Stack`,
  icons: {
    icon: "/logo.ico",
  },
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
    >
      <body className="min-h-dvh flex flex-col relative">
        <ThemeProvider>
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
