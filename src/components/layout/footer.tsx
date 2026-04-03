import { Menu, type MenuItem } from "@/components/ui/menu";

export const Footer = () => {
  const menuLinks: MenuItem[] = [
    { type: "link", href: "/legals", label: "Mentions légales" },
    { type: "link", href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="border-t bg-black text-white">
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center gap-4 xl:flex-row xl:justify-between">
          <p className="text-sm xl:text-base">
            &copy; {new Date().getFullYear()} - PHANG Willy
          </p>
          <ul className="flex flex-col items-center gap-4 xl:flex-row xl:gap-6">
            <Menu items={menuLinks} />
          </ul>
        </div>
      </div>
    </footer>
  );
};
