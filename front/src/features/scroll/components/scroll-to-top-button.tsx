"use client";

import { useEffect, useState } from "react";
import { LuArrowUp } from "react-icons/lu";
import { Button } from "@/components/ui/button";

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY >= 100);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="icon"
        aria-label="Remonter en haut"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <LuArrowUp className="w-8 h-8 md:w-6 md:h-6" />
      </Button>
    </div>
  );
};
