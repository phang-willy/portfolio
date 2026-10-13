import { expect, test, type Page } from '@playwright/test';

import { fillEditor } from './auth';
import { adminCredentials, adminURL, frontURL } from './env';
import { clearMailbox, waitForMessage } from './maildev';

const stamp = Date.now().toString(36);
const slug = `e2e-${stamp}`;
const frTitle = `Projet E2E ${stamp}`;
const enTitle = `E2E project ${stamp}`;
const editedEnTitle = `E2E project edited ${stamp}`;
const stackName = `E2E Stack ${stamp}`;
const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';
const company = `E2E Co ${stamp}`;
const roleFr = `Role FR ${stamp}`;
const roleEn = `Role EN ${stamp}`;
const contactEmail = `e2e-${stamp}@example.com`;
const contactSubject = `E2E contact ${stamp}`;

test('creates, publishes, edits, and deletes a project in both languages', async ({ page }) => {
  await page.goto(`${adminURL}/admin/projects/create`);
  await page.locator('#slug').fill(slug);
  await page.locator('#fr-title').fill(frTitle);
  await page.locator('#fr-description').fill('Description française de test.');
  await fillEditor(page, 'Contenu français de test.');
  await page.getByRole('tab', { name: 'English' }).click();
  await page.locator('#en-title').fill(enTitle);
  await page.locator('#en-description').fill('English test description.');
  await fillEditor(page, 'English test content.');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page).toHaveURL(/\/admin\/projects$/);

  await openPublic(page, `${frontURL}/projects/${slug}`);
  await expect(page.getByRole('heading', { name: frTitle })).toBeVisible();
  await openPublic(page, `${frontURL}/en/projects/${slug}`);
  await expect(page.getByRole('heading', { name: enTitle })).toBeVisible();

  await page.goto(`${adminURL}/admin/projects`);
  await page.locator('#search').fill(slug);
  await page.getByRole('link', { name: `Edit ${slug}` }).click();
  await page.getByRole('tab', { name: 'English' }).click();
  await page.locator('#en-title').fill(editedEnTitle);
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Project saved successfully.')).toBeVisible();

  await openPublic(page, `${frontURL}/en/projects/${slug}`);
  await expect(page.getByRole('heading', { name: editedEnTitle })).toBeVisible();
  await openPublic(page, `${frontURL}/projects/${slug}`);
  await expect(page.getByRole('heading', { name: frTitle })).toBeVisible();

  await page.goto(`${adminURL}/admin/projects`);
  await page.locator('#search').fill(slug);
  await deactivateAndDelete(page, slug);

  const missing = await page.goto(`${frontURL}/projects/${slug}`);
  expect(missing?.status()).toBeGreaterThanOrEqual(400);
});

test('creates an SVG stack and shows it on the project', async ({ page }) => {
  await page.goto(`${adminURL}/admin/stacks`);
  await page.getByRole('button', { name: 'New stack' }).click();
  await page.locator('#stack-name').fill(stackName);
  await page.locator('#stack-image').fill(svg);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.locator('#search').fill(stackName);
  await expect(page.getByText(stackName).first()).toBeVisible();

  await page.goto(`${adminURL}/admin/projects/create`);
  await page.locator('#slug').fill(`${slug}-stack`);
  await page.locator('#fr-title').fill(`${frTitle} stack`);
  await fillEditor(page, 'Contenu stack.');
  await page.getByRole('tab', { name: 'English' }).click();
  await page.locator('#en-title').fill(`${enTitle} stack`);
  await fillEditor(page, 'Stack content.');
  await page.getByPlaceholder('Select stacks').click();
  await page.getByRole('option', { name: stackName, exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page).toHaveURL(/\/admin\/projects$/);

  await openPublic(page, `${frontURL}/projects/${slug}-stack`);
  await expect(page.getByText(stackName)).toBeVisible();
  await openPublic(page, `${frontURL}/en/projects/${slug}-stack`);
  await expect(page.getByText(stackName)).toBeVisible();

  await page.goto(`${adminURL}/admin/projects`);
  await page.locator('#search').fill(`${slug}-stack`);
  await page.getByRole('link', { name: `Edit ${slug}-stack` }).click();
  await page.locator('[data-slot="combobox-chip"]', { hasText: stackName }).locator('button').click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Project saved successfully.')).toBeVisible();
  await openPublic(page, `${frontURL}/projects/${slug}-stack`);
  await expect(page.getByText(stackName)).toHaveCount(0);

  await page.goto(`${adminURL}/admin/projects`);
  await page.locator('#search').fill(`${slug}-stack`);
  await deactivateAndDelete(page, `${slug}-stack`);

  await page.goto(`${adminURL}/admin/stacks`);
  await page.locator('#search').fill(stackName);
  await page.getByRole('button', { name: `Delete ${stackName}` }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('button', { name: `Delete ${stackName}` })).toHaveCount(0);
});

test('creates an experience visible in French and English', async ({ page }) => {
  await page.goto(`${adminURL}/admin/experiences/create`);
  await page.locator('#company').fill(company);
  await page.locator('#yearStart').fill('2024');
  await page.locator('#fr-role').fill(roleFr);
  await page.locator('#fr-summary').fill('Résumé français.');
  await page.getByRole('tab', { name: 'English' }).click();
  await page.locator('#en-role').fill(roleEn);
  await page.locator('#en-summary').fill('English summary.');
  await page.getByRole('button', { name: 'Create experience' }).click();
  await expect(page).toHaveURL(/\/admin\/experiences$/);

  await openPublic(page, `${frontURL}/`);
  await expect(page.locator('#experiences')).toContainText(roleFr);
  await openPublic(page, `${frontURL}/en`);
  await expect(page.locator('#experiences')).toContainText(roleEn);

  await page.goto(`${adminURL}/admin/experiences`);
  await page.locator('#search').fill(company);
  await deactivateAndDelete(page, company);
});

test('receives a public contact, replies, and queues the email', async ({ page, context }) => {
  const { email } = adminCredentials();
  await page.goto(`${adminURL}/admin/dashboard`);
  const before = await unreadCount(page);

  const contact = await context.newPage();
  await contact.goto(`${frontURL}/contact`);
  await contact.locator('input[name="firstName"]').fill('E2E');
  await contact.locator('input[name="lastName"]').fill('Visitor');
  await contact.locator('input[name="email"]').fill(contactEmail);
  await contact.locator('input[name="phone"]').fill('0600000000');
  await contact.locator('input[name="title"]').fill(contactSubject);
  await contact.locator('textarea[name="message"]').fill('Message automatique de bout en bout.');
  await contact.getByRole('button', { name: /envoyer|send/i }).click();
  await expect(contact.getByText('Votre message a bien été envoyé. Merci !')).toBeVisible();

  await expect.poll(() => unreadCount(page)).toBeGreaterThan(before);

  await page.goto(`${adminURL}/admin/contact`);
  await page.locator('#contact-search').fill(contactSubject);
  await page.getByRole('link', { name: `Open enquiry: ${contactSubject}` }).click();
  await page.locator('#contact-reply-message').fill('Réponse automatique de test.');
  await clearMailbox();
  await page.getByRole('button', { name: 'Send reply' }).click();
  await expect(page.getByText('Reply saved and queued for delivery.')).toBeVisible();

  await page.goto(`${adminURL}/admin/email-queue`);
  await expect(page.getByText(contactEmail).first()).toBeVisible();
  await waitForMessage(contactEmail, 'SUITE');
  await page.goto(`${adminURL}/admin/dashboard`);
  await expect(page.getByRole('link', { name: /Email queue/ }).first()).toBeVisible();
});

test('logs out and then refuses the admin again', async ({ page }) => {
  await page.goto(`${adminURL}/admin/dashboard`);
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto(`${adminURL}/admin/projects`);
  await expect(page).toHaveURL(/\/login/);
});

async function deactivateAndDelete(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: `Deactivate ${name}` }).click();
  await page.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await page.getByRole('button', { name: `Delete ${name}` }).click();
  await page.getByRole('button', { name: 'Delete Permanently' }).click();
  await expect(page.getByRole('button', { name: `Delete ${name}` })).toHaveCount(0);
}

async function openPublic(page: Page, url: string): Promise<void> {
  const response = await page.goto(url);
  expect(response?.ok(), url).toBe(true);
}

async function unreadCount(page: Page): Promise<number> {
  const label = page.getByRole('link', { name: /unread enquir/ });
  await expect(label).toBeVisible();
  const text = (await label.getAttribute('aria-label')) ?? '';
  return Number(text.match(/(\d+) unread/)?.[1] ?? '0');
}
