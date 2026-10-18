import { User } from '@/app/shared/models/user.model';

export interface HoneypotPayload {
  website?: string;
}

export interface LoginRequest extends HoneypotPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  requiresTwoFactor: boolean;
}

export interface AuthPublicConfig {
  registerEnabled: boolean;
}

export interface RegisterRequest extends HoneypotPayload {
  lastname: string;
  firstname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthenticatedUserResponse {
  user: User;
}

export interface AuthMessageResponse {
  message: string;
}

export interface VerifyTwoFactorRequest extends HoneypotPayload {
  email: string;
  code: string;
  rememberMe: boolean;
}

export interface ForgotPasswordRequest extends HoneypotPayload {
  email: string;
}

export interface ResetPasswordRequest extends HoneypotPayload {
  token: string;
  password: string;
  confirmPassword: string;
}
