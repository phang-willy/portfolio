"use client";

import { useTheme } from "@/features/theme/hooks/use-theme";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useTheme();

  return <>{children}</>;
};
