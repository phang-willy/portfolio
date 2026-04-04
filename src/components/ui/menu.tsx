"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderMenuLinkItem = {
  type: "link";
  href: string;
  label: string;
};

type HeaderMenuImageLinkItem = {
  type: "link-image";
  href: string;
  imageSrc: string;
  imageAlt: string;
  srLabel: string;
};

export type MenuItem = HeaderMenuLinkItem | HeaderMenuImageLinkItem;

type MenuProps = {
  items: MenuItem[];
};

export const Menu = ({ items }: MenuProps) => {
  const pathname = usePathname();

  return (
    <>
      {items.map((link) => (
        <li key={`${link.type}-${link.href}`}>
          {link.type === "link-image" ? (
            <Link href={link.href}>
              <Image
                src={link.imageSrc}
                alt={link.imageAlt}
                className="rounded-full w-10 h-10 object-cover"
                width={500}
                height={500}
              />
              <span className="sr-only">{link.srLabel}</span>
            </Link>
          ) : (
            <Link
              href={link.href}
              className={`text-sm xl:text-base font-medium transition-colors duration-300 ${
                pathname === link.href ? "text-main" : "hover:text-main"
              }`}
            >
              {link.label}
            </Link>
          )}
        </li>
      ))}
    </>
  );
};
