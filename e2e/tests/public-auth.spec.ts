import { expect, test } from '@playwright/test';

import { adminURL } from './env';

test('rejects a wrong password without opening the dashboard', async ({ page }) => {
  await page.goto(`${adminURL}/login`);
  await page.locator('#login-email').fill('nobody@example.com');
  await page.locator('#login-password').fill('not-the-password');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('.auth-feedback-error')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin login' })).toBeVisible();
});

test('sends an anonymous admin visit back to login', async ({ page }) => {
  await page.goto(`${adminURL}/admin/projects`);
  await expect(page).toHaveURL(/\/login/);
});
