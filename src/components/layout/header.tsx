import { ThemeToggle } from "@/features/theme/components/theme-toggle";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="border-b">
      <div className="container mx-auto p-4">
        <nav className="flex items-center justify-between">
          <ul className="flex items-center gap-4">
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
          <ul className="flex items-center gap-4">
            <li>
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};
