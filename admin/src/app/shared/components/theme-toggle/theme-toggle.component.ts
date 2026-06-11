import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';

import { ThemePreference, ThemeService } from '@/app/core/theme/theme.service';

interface ThemeOption {
  readonly value: ThemePreference;
  readonly label: string;
  readonly icon: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
  { value: 'system', label: 'System', icon: 'pi pi-desktop' },
];

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly themeService = inject(ThemeService);

  protected readonly isOpen = signal(false);
  protected readonly options = THEME_OPTIONS;
  protected readonly preference = this.themeService.preference;
  protected readonly currentIcon = computed(() =>
    this.themeService.resolvedTheme() === 'dark' ? 'pi pi-moon' : 'pi pi-sun',
  );

  protected toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update((isOpen) => !isOpen);
  }

  protected selectTheme(preference: ThemePreference, event: MouseEvent): void {
    event.stopPropagation();
    this.themeService.setTheme(preference);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Node && !this.elementRef.nativeElement.contains(target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.isOpen.set(false);
  }
}
