"use client";

import { Dropdown } from "@/components/ui/dropdown";
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
        <button className="rounded-md border p-2 cursor-pointer dark:text-white dark:bg-dark-500 dark:hover:bg-gray-800 hover:bg-gray-200">
          {icons[theme]}
        </button>
      }
    >
      {({ close }) => (
        <div className="flex flex-col p-1 rounded-md border bg-white dark:bg-gray-900">
          <button
            onClick={() => {
              setTheme("light");
              close();
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <LuSun /> Light
          </button>

          <button
            onClick={() => {
              setTheme("dark");
              close();
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <LuMoon /> Dark
          </button>

          <button
            onClick={() => {
              setTheme("system");
              close();
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
          >
            <LuMonitorSmartphone /> System
          </button>
        </div>
      )}
    </Dropdown>
  );
};
