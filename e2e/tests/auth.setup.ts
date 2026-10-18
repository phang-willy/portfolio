import { mkdir } from 'node:fs/promises';

import { test as setup } from '@playwright/test';

import { login } from './auth';
import { adminCredentials } from './env';
import { clearMailbox } from './maildev';

setup('authenticate through MailDev', async ({ page }) => {
  const { email, password } = adminCredentials();
  await clearMailbox();
  await login(page, email, password);
  await mkdir('.auth', { recursive: true });
  await page.context().storageState({ path: '.auth/admin.json' });
});
