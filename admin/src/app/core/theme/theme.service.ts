import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const THEME_TRANSITION_DISABLED_CLASS = 'theme-transition-disabled';
const THEME_VALUES: readonly ThemePreference[] = ['light', 'dark', 'system'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly systemPrefersDark = signal(false);
  private readonly themePreference = signal<ThemePreference>(this.readStoredTheme());

  readonly preference = this.themePreference.asReadonly();
  readonly resolvedTheme = computed<ResolvedTheme>(() => {
    const preference = this.themePreference();

    if (preference === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }

    return preference;
  });

  constructor() {
    this.watchSystemTheme();

    effect(() => {
      this.applyTheme(this.themePreference(), this.resolvedTheme());
    });
  }

  setTheme(preference: ThemePreference): void {
    this.themePreference.set(preference);

    if (this.isBrowser) {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  }

  private readStoredTheme(): ThemePreference {
    if (!this.isBrowser) {
      return 'system';
    }

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(storedTheme) ? storedTheme : 'system';
  }

  private watchSystemTheme(): void {
    if (!this.isBrowser || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark.set(mediaQuery.matches);

    mediaQuery.addEventListener('change', (event) => {
      this.systemPrefersDark.set(event.matches);
    });
  }

  private applyTheme(preference: ThemePreference, resolvedTheme: ResolvedTheme): void {
    if (!this.isBrowser) {
      return;
    }

    const root = this.document.documentElement;

    root.classList.add(THEME_TRANSITION_DISABLED_CLASS);
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset['theme'] = preference;
    root.dataset['resolvedTheme'] = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    window.setTimeout(() => {
      root.classList.remove(THEME_TRANSITION_DISABLED_CLASS);
    });
  }
}

function isThemePreference(value: string | null): value is ThemePreference {
  return THEME_VALUES.includes(value as ThemePreference);
}
