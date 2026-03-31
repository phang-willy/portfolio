"use client";

import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/features/theme/hooks/use-theme";
import { LuMonitorSmartphone, LuMoon, LuSun } from "react-icons/lu";

export const ThemeToggle = () => {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) return null;

  const icons = {
    light: <LuSun className="w-4 h-4" />,
    dark: <LuMoon className="w-4 h-4" />,
    system: <LuMonitorSmartphone className="w-4 h-4" />,
  };

  return (
    <Dropdown
      trigger={
        <Button variant="outline" size="icon">
          {icons[theme]}
        </Button>
      }
    >
      {({ close }) => (
        <div className="flex flex-col p-1 rounded-md border bg-white dark:bg-dark-500">
          <Button
            onClick={() => {
              setTheme("light");
              close();
            }}
            variant="menu-item"
            className="gap-2 px-3 py-2"
          >
            <LuSun /> Clair
          </Button>

          <Button
            onClick={() => {
              setTheme("dark");
              close();
            }}
            variant="menu-item"
            className="gap-2 px-3 py-2"
          >
            <LuMoon /> Sombre
          </Button>

          <Button
            onClick={() => {
              setTheme("system");
              close();
            }}
            variant="menu-item"
            className="gap-2 px-3 py-2"
          >
            <LuMonitorSmartphone /> Système
          </Button>
        </div>
      )}
    </Dropdown>
  );
};
