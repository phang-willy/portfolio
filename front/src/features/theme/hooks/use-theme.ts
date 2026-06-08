"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Theme } from "@/features/theme/types/theme.types";
import {
  getSystemTheme,
  getStoredTheme,
  THEME_KEY,
} from "@/features/theme/utils/theme.utils";

function subscribeToHydration() {
  return () => {};
}

function getHydrationSnapshot() {
  return true;
}

function getHydrationServerSnapshot() {
  return false;
}

export const useTheme = () => {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return getStoredTheme();
  });

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    const appliedTheme = theme === "system" ? getSystemTheme() : theme;

    root.classList.remove("light", "dark");
    root.classList.add(appliedTheme);

    localStorage.setItem(THEME_KEY, theme);
  }, [theme, mounted]);

  return { theme, setTheme, mounted };
};
