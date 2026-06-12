import { ZodError } from 'zod';

export function zodIssuesToFieldErrors<TField extends string>(
  error: ZodError,
): Partial<Record<TField, string>> {
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== 'string') {
      continue;
    }

    const key = field as TField;
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
