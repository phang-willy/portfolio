const BREVO_SMTP_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_ACCOUNT_URL = "https://api.brevo.com/v3/account";

export type BrevoRecipient = {
  email: string;
  name?: string;
};

export type BrevoSender = {
  email: string;
  name?: string;
};

type BrevoSmtpSuccessBody = {
  messageId?: string;
};

export class BrevoRequestError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "BrevoRequestError";
    this.status = status;
    this.body = body;
  }
}

function requireApiKey(): string {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) {
    throw new Error("BREVO_API_KEY is not configured.");
  }
  return key;
}

export function getBrevoSenderFromEnv(): BrevoSender {
  const email = process.env.BREVO_SENDER_EMAIL?.trim();
  const name = process.env.BREVO_SENDER_NAME?.trim();

  if (!email) {
    throw new Error("BREVO_SENDER_EMAIL is not configured.");
  }

  return name ? { email, name } : { email };
}

/**
 * Low-level POST to Brevo transactional email API. Prefer the typed helpers below.
 */
export async function brevoGetAccount(): Promise<unknown> {
  const apiKey = requireApiKey();

  const response = await fetch(BREVO_ACCOUNT_URL, {
    method: "GET",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
    },
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new BrevoRequestError(
      `Brevo account API error (${response.status}).`,
      response.status,
      rawBody,
    );
  }

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return {};
  }
}

export async function brevoSendSmtpEmail(
  payload: Record<string, unknown>,
): Promise<BrevoSmtpSuccessBody> {
  const apiKey = requireApiKey();

  const response = await fetch(BREVO_SMTP_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new BrevoRequestError(
      `Brevo API error (${response.status}).`,
      response.status,
      rawBody,
    );
  }

  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as BrevoSmtpSuccessBody;
  } catch {
    return {};
  }
}

export async function brevoSendHtmlEmail(input: {
  sender: BrevoSender;
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  replyTo?: BrevoRecipient;
}): Promise<BrevoSmtpSuccessBody> {
  const body: Record<string, unknown> = {
    sender: input.sender,
    to: input.to,
    subject: input.subject,
    htmlContent: input.htmlContent,
  };

  if (input.replyTo) {
    body.replyTo = input.replyTo;
  }

  return brevoSendSmtpEmail(body);
}

export async function brevoSendTemplateEmail(input: {
  sender: BrevoSender;
  to: BrevoRecipient[];
  templateId: number;
  params: Record<string, string>;
  replyTo?: BrevoRecipient;
}): Promise<BrevoSmtpSuccessBody> {
  const body: Record<string, unknown> = {
    sender: input.sender,
    to: input.to,
    templateId: input.templateId,
    params: input.params,
  };

  if (input.replyTo) {
    body.replyTo = input.replyTo;
  }

  return brevoSendSmtpEmail(body);
}
