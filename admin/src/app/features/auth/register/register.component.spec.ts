import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '@/app/core/auth/auth.service';
import { RegisterComponent } from '@/app/features/auth/register/register.component';

type RegisterComponentHarness = RegisterComponent & {
  registerForm: RegisterComponent['registerForm'];
  submitRegister(): void;
  successMessage(): string | null;
};

describe('RegisterComponent', () => {
  const register = vi.fn();

  beforeEach(async () => {
    register.mockReset();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { register },
        },
      ],
    }).compileComponents();
  });

  it('does not call the API when the honeypot is filled', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance as RegisterComponentHarness;

    component.registerForm.setValue({
      firstname: 'Willy',
      lastname: 'Dupont',
      email: 'willy@example.com',
      password: 'password1',
      confirmPassword: 'password1',
      website: 'https://spam.example',
    });

    component.submitRegister();

    expect(register).not.toHaveBeenCalled();
    expect(component.successMessage()).toBe('Registration created. Please verify your email.');
  });

  it('calls the API when the honeypot stays empty', () => {
    register.mockReturnValue(
      of({ message: 'Registration created. Please verify your email.' }),
    );

    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance as RegisterComponentHarness;

    component.registerForm.setValue({
      firstname: 'Willy',
      lastname: 'Dupont',
      email: 'willy@example.com',
      password: 'password1',
      confirmPassword: 'password1',
      website: '',
    });

    component.submitRegister();

    expect(register).toHaveBeenCalledWith({
      firstname: 'Willy',
      lastname: 'Dupont',
      email: 'willy@example.com',
      password: 'password1',
      confirmPassword: 'password1',
      website: '',
    });
  });
});
