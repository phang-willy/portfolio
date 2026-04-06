"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { ZodError } from "zod";
import { LuLoaderCircle, LuRefreshCw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/hooks/use-i18n";
import { getContactApiUrl } from "@/lib/contact-api-url";
import {
  contactSubmissionBodySchema,
  normalizeCaptchaInput,
  type ContactFormPayload,
} from "@/lib/contact-schema";

type ContactFormValues = Record<keyof ContactFormPayload, string>;
type FieldErrorKey = keyof ContactFormValues | "captcha";

type ContactApiIssue = { path: string[]; message: string };

type ContactApiResponse =
  | { ok: true }
  | {
      ok: false;
      error: string;
      message?: string;
      reason?: string;
      issues?: ContactApiIssue[];
    };

type ServiceCheckState =
  | { phase: "ready" }
  | { phase: "blocked"; message: string; reason?: string };

const emptyValues: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  title: "",
  message: "",
};

function issuesToFieldErrors(
  issues: ContactApiIssue[],
): Partial<Record<FieldErrorKey, string>> {
  const out: Partial<Record<FieldErrorKey, string>> = {};
  const keys = new Set<string>([...Object.keys(emptyValues), "captcha"]);

  for (const issue of issues) {
    const key = issue.path[0];
    if (!key || !keys.has(key)) {
      continue;
    }
    const fieldKey = key as FieldErrorKey;
    if (!out[fieldKey]) {
      out[fieldKey] = issue.message;
    }
  }

  return out;
}

function zodIssuesToFieldErrors(
  error: ZodError,
): Partial<Record<FieldErrorKey, string>> {
  const apiIssues: ContactApiIssue[] = error.issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
  }));
  return issuesToFieldErrors(apiIssues);
}

type ContactFormProps = {
  className?: string;
};

export function ContactForm({ className }: ContactFormProps) {
  const { t } = useI18n();
  const baseId = useId();

  const fieldConfig = useMemo(
    () =>
      [
        {
          key: "firstName" as const,
          label: t.contactForm.fields.firstName,
          type: "text" as const,
          autoComplete: "given-name",
          required: true,
        },
        {
          key: "lastName" as const,
          label: t.contactForm.fields.lastName,
          type: "text" as const,
          autoComplete: "family-name",
          required: true,
        },
        {
          key: "email" as const,
          label: t.contactForm.fields.email,
          type: "email" as const,
          autoComplete: "email",
          required: true,
        },
        {
          key: "phone" as const,
          label: t.contactForm.fields.phone,
          type: "tel" as const,
          autoComplete: "tel",
          required: true,
        },
        {
          key: "company" as const,
          label: t.contactForm.fields.company,
          type: "text" as const,
          autoComplete: "organization",
          required: false,
        },
        {
          key: "title" as const,
          label: t.contactForm.fields.title,
          type: "text" as const,
          autoComplete: "organization-title",
          required: true,
        },
        {
          key: "message" as const,
          label: t.contactForm.fields.message,
          type: "textarea" as const,
          autoComplete: "off",
          required: true,
        },
      ] as const,
    [t],
  );
  const [serviceCheck, setServiceCheck] = useState<ServiceCheckState>({
    phase: "ready",
  });
  const [values, setValues] = useState<ContactFormValues>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldErrorKey, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaDisplay, setCaptchaDisplay] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaFetchError, setCaptchaFetchError] = useState<string | null>(
    null,
  );

  const captchaId = `${baseId}-captcha`;

  const fetchCaptcha = useCallback(async () => {
    setCaptchaFetchError(null);
    setCaptchaLoading(true);
    setCaptchaInput("");
    setFieldErrors((prev) => {
      if (!prev.captcha) {
        return prev;
      }
      const next = { ...prev };
      delete next.captcha;
      return next;
    });
    try {
      const res = await fetch(getContactApiUrl("/api/contact/captcha"));
      const data = (await res.json()) as {
        code?: string;
        captchaToken?: string;
        error?: string;
        message?: string;
      };
      if (res.status === 429) {
        setCaptchaDisplay("");
        setCaptchaToken("");
        setCaptchaFetchError(
          data.message ?? t.contactForm.errors.rateLimitCaptcha,
        );
        return;
      }
      if (!res.ok || !data.code || !data.captchaToken) {
        setCaptchaDisplay("");
        setCaptchaToken("");
        setCaptchaFetchError(t.contactForm.errors.captchaLoad);
        return;
      }
      setCaptchaDisplay(data.code);
      setCaptchaToken(data.captchaToken);
    } catch {
      setCaptchaDisplay("");
      setCaptchaToken("");
      setCaptchaFetchError(t.contactForm.errors.captchaLoad);
    } finally {
      setCaptchaLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch(getContactApiUrl("/api/contact"));
        const data = (await res.json()) as {
          canSubmit?: boolean;
          message?: string;
          reason?: string;
          creditsRemaining?: number | null;
        };
        if (cancelled) {
          return;
        }
        if (res.status === 429) {
          setServiceCheck({
            phase: "blocked",
            message: data.message ?? t.contactForm.errors.rateLimitHealthcheck,
            reason: "RATE_LIMITED",
          });
          return;
        }
        if (data.canSubmit) {
          setServiceCheck({ phase: "ready" });
        } else {
          setServiceCheck({
            phase: "blocked",
            message: data.message ?? t.contactForm.errors.unavailableGeneric,
            reason: data.reason,
          });
        }
      } catch {
        if (!cancelled) {
          setServiceCheck({
            phase: "blocked",
            message: t.contactForm.errors.unavailableGeneric,
            reason: "NETWORK",
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (serviceCheck.phase !== "ready") {
      return;
    }
    void fetchCaptcha();
  }, [serviceCheck.phase, fetchCaptcha]);

  const setField = (key: keyof ContactFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const submissionBody = {
      ...values,
      captcha: captchaInput,
      captchaToken,
    };
    const parsedLocal = contactSubmissionBodySchema.safeParse(submissionBody);
    if (!parsedLocal.success) {
      setFieldErrors(zodIssuesToFieldErrors(parsedLocal.error));
      return;
    }

    if (serviceCheck.phase !== "ready") {
      return;
    }

    if (!captchaToken) {
      setCaptchaFetchError(t.contactForm.errors.captchaMissing);
      return;
    }

    if (!contactSubmissionBodySchema.safeParse(submissionBody).success) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(getContactApiUrl("/api/contact"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsedLocal.data),
      });

      let payload: ContactApiResponse;
      try {
        payload = (await response.json()) as ContactApiResponse;
      } catch {
        setFormError(t.contactForm.errors.invalidServerResponse);
        return;
      }

      if (!response.ok || !payload.ok) {
        if (
          payload.ok === false &&
          payload.error === "VALIDATION_ERROR" &&
          payload.issues
        ) {
          const nextErrors = issuesToFieldErrors(payload.issues);
          setFieldErrors(nextErrors);
          if (nextErrors.captcha) {
            void fetchCaptcha();
          }
          return;
        }

        if (payload.ok === false && payload.error === "CONTACT_UNAVAILABLE") {
          setServiceCheck({
            phase: "blocked",
            message: payload.message ?? t.contactForm.errors.unavailableGeneric,
            reason: payload.reason,
          });
          return;
        }

        const message =
          payload.ok === false && payload.message
            ? payload.message
            : t.contactForm.errors.genericSubmit;
        setFormError(message);
        return;
      }

      setValues(emptyValues);
      setCaptchaInput("");
      void fetchCaptcha();
      setSuccessMessage(t.contactForm.success);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch {
      setFormError(t.contactForm.errors.network);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    "w-full rounded-md border border-border bg-white px-3 py-2 text-base text-black shadow-sm transition-[box-shadow,colors] duration-200 placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-dark-500 dark:text-white dark:border-border-dark dark:placeholder:text-white/40 dark:focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60";

  const fieldsLocked = serviceCheck.phase === "blocked" || isSubmitting;

  const submissionDraft = useMemo(
    () => ({
      ...values,
      captcha: normalizeCaptchaInput(captchaInput),
      captchaToken,
    }),
    [values, captchaInput, captchaToken],
  );

  const isFormComplete = useMemo(() => {
    if (serviceCheck.phase !== "ready") {
      return false;
    }
    if (!captchaToken || captchaFetchError || captchaLoading) {
      return false;
    }
    return contactSubmissionBodySchema.safeParse(submissionDraft).success;
  }, [
    serviceCheck.phase,
    captchaToken,
    captchaFetchError,
    captchaLoading,
    submissionDraft,
  ]);

  const submitDisabled = fieldsLocked || !isFormComplete;

  const submitBlockedHint =
    serviceCheck.phase === "ready" && !isSubmitting && !isFormComplete;

  const blockedBannerClass =
    serviceCheck.phase === "blocked" && serviceCheck.reason === "QUOTA"
      ? "border-amber-600/50 bg-amber-500/10 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100"
      : "border-red-500/50 bg-red-500/10 text-red-800 dark:text-red-200";

  return (
    <div className={className}>
      {serviceCheck.phase === "blocked" ? (
        <p
          className={`mb-6 rounded-md border px-4 py-3 text-sm ${blockedBannerClass}`}
          role="alert"
        >
          {serviceCheck.message}
        </p>
      ) : null}

      {successMessage ? (
        <p
          className="mb-6 rounded-md border border-main/40 bg-main/10 px-4 py-3 text-sm text-black dark:text-white"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </p>
      ) : null}

      {formError ? (
        <p
          className="mb-6 rounded-md border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        {fieldConfig.map((field) => {
          const id = `${baseId}-${field.key}`;
          const errorId = `${id}-error`;
          const error = fieldErrors[field.key];
          const describedBy = error ? errorId : undefined;

          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-sm font-medium">
                {field.label}
                {field.required ? (
                  <span className="text-main" aria-hidden>
                    {" "}
                    *
                  </span>
                ) : (
                  <span className="text-black/50 dark:text-white/50 font-normal text-xs ml-1">
                    {t.contactForm.optional}
                  </span>
                )}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={id}
                  name={field.key}
                  value={values[field.key]}
                  onChange={(e) => setField(field.key, e.target.value)}
                  rows={6}
                  autoComplete={field.autoComplete}
                  aria-invalid={Boolean(error)}
                  aria-describedby={describedBy}
                  aria-required={field.required ? true : undefined}
                  disabled={fieldsLocked}
                  className={`${inputClassName} min-h-[140px] resize-y`}
                />
              ) : (
                <input
                  id={id}
                  name={field.key}
                  type={field.type}
                  value={values[field.key]}
                  onChange={(e) => setField(field.key, e.target.value)}
                  autoComplete={field.autoComplete}
                  aria-invalid={Boolean(error)}
                  aria-describedby={describedBy}
                  aria-required={field.required ? true : undefined}
                  disabled={fieldsLocked}
                  className={inputClassName}
                />
              )}
              {error ? (
                <p
                  id={errorId}
                  className="text-sm text-red-600 dark:text-red-400"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}

        <div className="flex flex-col gap-3 rounded-md border border-border bg-black/2 p-4 dark:bg-white/3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <label htmlFor={captchaId} className="text-sm font-medium">
              {t.contactForm.captchaLabel}
              <span className="text-main" aria-hidden>
                {" "}
                *
              </span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                isSubmitting || serviceCheck.phase !== "ready" || captchaLoading
              }
              onClick={() => void fetchCaptcha()}
              className="gap-1.5 shrink-0"
              aria-label={t.contactForm.newCodeAria}
            >
              <LuRefreshCw
                className={`size-3.5 shrink-0 ${captchaLoading ? "animate-spin" : ""}`}
                aria-hidden
              />
              {t.contactForm.newCode}
            </Button>
          </div>

          {captchaFetchError ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {captchaFetchError}{" "}
              <button
                type="button"
                className="text-main underline underline-offset-2 hover:opacity-90"
                onClick={() => void fetchCaptcha()}
              >
                {t.contactForm.retry}
              </button>
            </p>
          ) : null}

          <div
            className="flex min-h-11 items-center justify-center rounded-md border border-dashed border-main/50 bg-white px-4 py-3 font-mono text-lg font-semibold tracking-normal text-black select-all dark:bg-dark-500 dark:text-white"
            aria-live="polite"
          >
            {captchaLoading ? (
              <span className="flex items-center gap-2 text-sm font-normal tracking-normal text-black/60 dark:text-white/60">
                <LuLoaderCircle
                  className="size-4 animate-spin text-main"
                  aria-hidden
                />
                {t.contactForm.captchaGenerating}
              </span>
            ) : captchaDisplay ? (
              captchaDisplay
            ) : (
              <span className="text-sm font-normal tracking-normal text-black/50 dark:text-white/50">
                —
              </span>
            )}
          </div>

          <input
            id={captchaId}
            name="captcha"
            type="text"
            value={captchaInput}
            onChange={(e) => {
              setCaptchaInput(e.target.value);
              setFieldErrors((prev) => {
                if (!prev.captcha) {
                  return prev;
                }
                const next = { ...prev };
                delete next.captcha;
                return next;
              });
            }}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={Boolean(fieldErrors.captcha)}
            aria-describedby={
              fieldErrors.captcha ? `${captchaId}-error` : undefined
            }
            aria-required
            disabled={fieldsLocked}
            className={inputClassName}
            placeholder={t.contactForm.captchaPlaceholder}
          />
          {fieldErrors.captcha ? (
            <p
              id={`${captchaId}-error`}
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {fieldErrors.captcha}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="submit"
            variant="main"
            disabled={submitDisabled}
            aria-busy={isSubmitting}
            title={
              submitBlockedHint ? t.contactForm.submitHintBlocked : undefined
            }
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <LuLoaderCircle
                  className="size-4 shrink-0 animate-spin"
                  aria-hidden
                />
                <span>{t.contactForm.submitSending}</span>
              </>
            ) : serviceCheck.phase === "blocked" ? (
              t.contactForm.submitUnavailable
            ) : (
              t.contactForm.submit
            )}
          </Button>
          <p className="text-sm text-black/60 dark:text-white/60">
            {submitBlockedHint
              ? t.contactForm.submitHintFooter
              : t.contactForm.submitHintRequired}
          </p>
        </div>
      </form>
    </div>
  );
}
