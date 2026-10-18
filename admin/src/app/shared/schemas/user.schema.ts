import { z } from 'zod';

import { USER_ROLES } from '@/app/shared/models/user-role';

export const userFormSchema = z.object({
  lastname: z.string().trim().min(1, 'Last name is required.').max(255, 'Last name is too long.'),
  firstname: z.string().trim().min(1, 'First name is required.').max(255, 'First name is too long.'),
  email: z.string().trim().email('Enter a valid email.').max(320, 'Email is too long.'),
  role: z.enum(USER_ROLES),
  active: z.boolean(),
});

export type UserFormValue = z.infer<typeof userFormSchema>;

export const profileFormSchema = z.object({
  lastname: z.string().trim().min(1, 'Last name is required.').max(255, 'Last name is too long.'),
  firstname: z.string().trim().min(1, 'First name is required.').max(255, 'First name is too long.'),
  email: z.string().trim().email('Enter a valid email.').max(320, 'Email is too long.'),
});

export type ProfileFormValue = z.infer<typeof profileFormSchema>;

export const profilePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, 'Current password is required.')
      .max(255, 'Current password is too long.'),
    newPassword: z
      .string()
      .min(8, 'Password must contain at least 8 characters.')
      .max(255, 'Password is too long.'),
    confirmPassword: z
      .string()
      .min(8, 'Confirm password must contain at least 8 characters.')
      .max(255, 'Confirm password is too long.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  });

export type ProfilePasswordValue = z.infer<typeof profilePasswordSchema>;
