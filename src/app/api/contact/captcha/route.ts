import { NextResponse } from "next/server";
import {
  createSignedCaptchaToken,
  generateContactCaptchaCode,
} from "@/lib/contact-captcha";
import { contactTooManyRequestsResponse } from "@/lib/security/contact-api-responses";
import { rateLimitContact } from "@/lib/security/contact-request";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rl = rateLimitContact(request, "captcha");
  if (!rl.ok) {
    return contactTooManyRequestsResponse(rl.retryAfterSeconds);
  }

  try {
    const code = generateContactCaptchaCode();
    const captchaToken = createSignedCaptchaToken(code);
    return NextResponse.json({ code, captchaToken });
  } catch (e) {
    console.error("[contact/captcha]", e);
    return NextResponse.json(
      { ok: false as const, error: "CAPTCHA_UNAVAILABLE" },
      { status: 503 },
    );
  }
}
