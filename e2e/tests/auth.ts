import { expect, type Page } from '@playwright/test';

import { adminURL } from './env';
import { waitForCode } from './maildev';

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${adminURL}/login`);
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.waitForURL('**/2fa**');
  const code = await waitForCode(email, 'authentication code');
  await page.locator('brn-input-otp').click();
  await page.keyboard.type(code);
  await page.getByRole('button', { name: 'Verify' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/);
  await expect(page.getByRole('heading', { name: /Welcome,/ })).toBeVisible();
}

export async function fillEditor(page: Page, text: string): Promise<void> {
  const editor = page.locator('.ProseMirror').filter({ visible: true }).first();
  await editor.click();
  await page.keyboard.type(text);
}
