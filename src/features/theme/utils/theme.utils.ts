import { Theme } from "@/features/theme/types/theme.types"

export const THEME_KEY = 'theme'

export const getSystemTheme = (): "light" | "dark" => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const getStoredTheme = (): Theme => {
  return (localStorage.getItem(THEME_KEY) as Theme) || "system";
};
