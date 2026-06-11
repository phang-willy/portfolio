import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';

import { routes } from '@/app/app.routes';
import { authInterceptor } from '@/app/core/interceptors/auth.interceptor';

const LIGHT_SURFACE = {
  0: '#ffffff',
  50: '{slate.50}',
  100: '{slate.100}',
  200: '{slate.200}',
  300: '{slate.300}',
  400: '{slate.400}',
  500: '{slate.500}',
  600: '{slate.600}',
  700: '{slate.700}',
  800: '{slate.800}',
  900: '{slate.900}',
  950: '{slate.950}'
};

const DARK_SURFACE = {
  0: '{slate.950}',
  50: '{slate.900}',
  100: '{slate.800}',
  200: '{slate.700}',
  300: '{slate.600}',
  400: '{slate.500}',
  500: '{slate.400}',
  600: '{slate.300}',
  700: '{slate.200}',
  800: '{slate.100}',
  900: '{slate.50}',
  950: '#ffffff'
};

const LIGHT_PRIMARY = {
  50: '{blue.50}',
  100: '{blue.100}',
  200: '{blue.200}',
  300: '{blue.300}',
  400: '{blue.400}',
  500: '{blue.500}',
  600: '{blue.600}',
  700: '{blue.700}',
  800: '{blue.800}',
  900: '{blue.900}',
  950: '{blue.950}'
};

const DARK_PRIMARY = {
  50: '{blue.950}',
  100: '{blue.900}',
  200: '{blue.800}',
  300: '{blue.700}',
  400: '{blue.600}',
  500: '{blue.500}',
  600: '{blue.400}',
  700: '{blue.300}',
  800: '{blue.200}',
  900: '{blue.100}',
  950: '{blue.50}'
};

const LIGHT_FORM_FIELD = {
  background: '{surface.0}',
  disabledBackground: '{surface.100}',
  filledBackground: '{surface.50}',
  filledHoverBackground: '{surface.50}',
  filledFocusBackground: '{surface.50}',
  borderColor: '{surface.300}',
  hoverBorderColor: '{surface.400}',
  focusBorderColor: '{primary.color}',
  invalidBorderColor: '{red.500}',
  color: '{surface.950}',
  disabledColor: '{surface.500}',
  placeholderColor: '{surface.500}',
  invalidPlaceholderColor: '{red.500}',
  floatLabelColor: '{surface.500}',
  floatLabelFocusColor: '{primary.color}',
  floatLabelActiveColor: '{surface.500}',
  floatLabelInvalidColor: '{red.500}',
  iconColor: '{surface.500}',
  shadow: '0 0 #0000'
};

const DARK_FORM_FIELD = {
  background: '{surface.0}',
  disabledBackground: '{surface.100}',
  filledBackground: '{surface.50}',
  filledHoverBackground: '{surface.50}',
  filledFocusBackground: '{surface.50}',
  borderColor: '{surface.300}',
  hoverBorderColor: '{surface.400}',
  focusBorderColor: '{primary.color}',
  invalidBorderColor: '{red.400}',
  color: '{surface.950}',
  disabledColor: '{surface.500}',
  placeholderColor: '{surface.500}',
  invalidPlaceholderColor: '{red.400}',
  floatLabelColor: '{surface.500}',
  floatLabelFocusColor: '{primary.color}',
  floatLabelActiveColor: '{surface.500}',
  floatLabelInvalidColor: '{red.400}',
  iconColor: '{surface.500}',
  shadow: '0 0 #0000'
};

const ADMIN_PRESET = definePreset(Aura, {
  semantic: {
    primary: LIGHT_PRIMARY,
    colorScheme: {
      light: {
        primary: LIGHT_PRIMARY,
        surface: LIGHT_SURFACE,
        formField: LIGHT_FORM_FIELD
      },
      dark: {
        primary: DARK_PRIMARY,
        surface: DARK_SURFACE,
        formField: DARK_FORM_FIELD
      }
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    providePrimeNG({
      ripple: false,
      theme: {
        preset: ADMIN_PRESET,
        options: {
          darkModeSelector: '.dark'
        }
      }
    })
  ]
};
