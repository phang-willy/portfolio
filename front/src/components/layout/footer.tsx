import { FooterNav } from "@/components/layout/footer-nav";

export function Footer() {
  return (
    <footer className="border-t bg-black text-white">
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center gap-4 xl:flex-row xl:justify-between">
          <p className="text-sm xl:text-base">
            &copy; {new Date().getFullYear()} - PHANG Willy
          </p>
          <FooterNav />
        </div>
      </div>
    </footer>
  );
}
