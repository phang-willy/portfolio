import { User } from '@/app/shared/models/user.model';

export interface ProfileUpdateInput {
  lastname: string;
  firstname: string;
  email: string;
  confirmEmailChange: boolean;
  website: string;
}

export interface ProfileUpdateResult {
  user: User;
  signedOut: boolean;
}

export interface ProfilePasswordInput {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  website: string;
}
