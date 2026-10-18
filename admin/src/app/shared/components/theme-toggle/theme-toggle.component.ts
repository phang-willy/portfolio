import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { HlmIcon } from '@spartan-ng/helm/icon';

import { ThemePreference, ThemeService } from '@/app/core/theme/theme.service';

interface ThemeOption {
  readonly value: ThemePreference;
  readonly label: string;
  readonly icon: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: 'Light', icon: 'lucideSun' },
  { value: 'dark', label: 'Dark', icon: 'lucideMoon' },
  { value: 'system', label: 'System', icon: 'lucideMonitor' },
];

@Component({
  selector: 'app-theme-toggle',
  imports: [HlmIcon, NgIcon],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggleComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly themeService = inject(ThemeService);

  protected readonly isOpen = signal(false);
  protected readonly options = THEME_OPTIONS;
  protected readonly preference = this.themeService.preference;
  protected readonly currentIcon = computed(() =>
    this.themeService.resolvedTheme() === 'dark' ? 'lucideMoon' : 'lucideSun',
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
