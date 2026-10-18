export const adminURL = process.env.E2E_ADMIN_URL ?? 'http://127.0.0.1:3001';
export const frontURL = process.env.E2E_FRONT_URL ?? 'http://127.0.0.1:3000';
export const mailDevURL = process.env.E2E_MAILDEV_URL ?? 'http://127.0.0.1:1080';

export function adminCredentials(): { email: string; password: string } {
  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to the local admin account. The 2FA code is read from MailDev.',
    );
  }
  return { email, password };
}
