import { mailDevURL } from './env';

type MailDevAddress = { address?: string };
type MailDevMessage = {
  subject?: string;
  text?: string;
  html?: string;
  to?: MailDevAddress[];
  time?: string;
};

export async function clearMailbox(): Promise<void> {
  const response = await fetch(`${mailDevURL}/email/all`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`MailDev clear failed: ${response.status}`);
  }
}

export async function waitForCode(email: string, subjectIncludes: string): Promise<string> {
  const body = await waitForMessage(email, subjectIncludes);
  const code = body.match(/\b(\d{6})\b/)?.[1];
  if (!code) {
    throw new Error(`No 6-digit code in MailDev message "${subjectIncludes}".`);
  }
  return code;
}

export async function waitForMessage(email: string, subjectIncludes: string, timeoutMs = 70_000): Promise<string> {
  const started = Date.now();
  const recipient = email.toLowerCase();
  while (Date.now() - started < timeoutMs) {
    const response = await fetch(`${mailDevURL}/email`);
    if (!response.ok) {
      throw new Error(`MailDev list failed: ${response.status}`);
    }
    const messages = (await response.json()) as MailDevMessage[];
    const match = [...messages].reverse().find((message) => {
      const subject = message.subject ?? '';
      const to = (message.to ?? []).some((item) => item.address?.toLowerCase() === recipient);
      return to && subject.toLowerCase().includes(subjectIncludes.toLowerCase());
    });
    if (match) {
      return match.text || stripHtml(match.html ?? '');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`MailDev has no message for ${email} matching "${subjectIncludes}".`);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ');
}
