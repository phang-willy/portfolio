import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollToTopButton } from "@/features/scroll/components/scroll-to-top-button";

export const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Header />
      <main className="grow z-0 grid grid-cols-1 gap-16">{children}</main>
      <ScrollToTopButton />
      <Footer />
    </>
  );
};
