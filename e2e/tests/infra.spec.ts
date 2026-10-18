import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { expect, test } from '@playwright/test';

import { adminURL, frontURL } from './env';

const exec = promisify(execFile);
const enabled = process.env.E2E_INFRA === '1';

test.describe('local infrastructure', () => {
  test.skip(!enabled, 'Set E2E_INFRA=1 to stop and restart local containers.');

  test('serves an uploaded image after the backend container restarts', async ({ request }) => {
    const imageURL = process.env.E2E_IMAGE_URL;
    test.skip(!imageURL, 'Set E2E_IMAGE_URL to an /api/project/image/... URL.');
    await docker('restart', 'portfolio-back-dev-1');
    await expect.poll(async () => (await request.get('http://127.0.0.1:8000/api/health')).ok(), {
      timeout: 90_000,
    }).toBe(true);
    expect((await request.get(imageURL!)).ok()).toBe(true);
  });

  test('does not keep serving data when PostgreSQL or the backend is stopped', async ({ page, request }) => {
    await docker('stop', 'portfolio-postgres-1');
    try {
      await expect.poll(async () => (await request.get('http://127.0.0.1:8000/api/project')).ok(), {
        timeout: 20_000,
      }).toBe(false);
    } finally {
      await docker('start', 'portfolio-postgres-1');
    }

    await docker('stop', 'portfolio-back-dev-1');
    try {
      await page.goto(`${frontURL}/`, { waitUntil: 'commit', timeout: 15_000 }).catch(() => undefined);
      await page.goto(`${adminURL}/admin/dashboard`, { waitUntil: 'commit', timeout: 15_000 }).catch(() => undefined);
      expect(page.url().includes('/admin/dashboard')).toBe(false);
    } finally {
      await docker('start', 'portfolio-back-dev-1');
      await expect.poll(async () => (await request.get('http://127.0.0.1:8000/api/health')).ok(), {
        timeout: 90_000,
      }).toBe(true);
    }
  });
});

function docker(...args: string[]): Promise<unknown> {
  return exec('docker', args, { windowsHide: true });
}
