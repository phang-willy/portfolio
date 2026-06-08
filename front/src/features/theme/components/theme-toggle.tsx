"use client";

import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { useTheme } from "@/features/theme/hooks/use-theme";
import { LuMonitorSmartphone, LuMoon, LuSun } from "react-icons/lu";

export const ThemeToggle = () => {
  const { t } = useI18n();
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) return null;

  const icons = {
    light: <LuSun className="w-4 h-4" />,
    dark: <LuMoon className="w-4 h-4" />,
    system: <LuMonitorSmartphone className="w-4 h-4" />,
  };

  const srCurrentTheme =
    theme === "light"
      ? t.theme.srCurrentLight
      : theme === "dark"
        ? t.theme.srCurrentDark
        : t.theme.srCurrentSystem;

  return (
    <Dropdown
      trigger={
        <Button
          variant="outline"
          size="icon"
          aria-label={t.theme.triggerAria}
          title={t.theme.triggerAria}
        >
          {icons[theme]}
          <span className="sr-only">{srCurrentTheme}</span>
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
            <LuSun /> {t.theme.light}
            <span className="sr-only">{t.theme.srSelectLight}</span>
          </Button>

          <Button
            onClick={() => {
              setTheme("dark");
              close();
            }}
            variant="menu-item"
            className="gap-2 px-3 py-2"
          >
            <LuMoon /> {t.theme.dark}
            <span className="sr-only">{t.theme.srSelectDark}</span>
          </Button>

          <Button
            onClick={() => {
              setTheme("system");
              close();
            }}
            variant="menu-item"
            className="gap-2 px-3 py-2"
          >
            <LuMonitorSmartphone /> {t.theme.system}
            <span className="sr-only">{t.theme.srSelectSystem}</span>
          </Button>
        </div>
      )}
    </Dropdown>
  );
};
