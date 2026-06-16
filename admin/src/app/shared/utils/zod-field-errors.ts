import { ZodError } from 'zod';

export function zodIssuesToFieldErrors<TField extends string>(
  error: ZodError,
): Partial<Record<TField, string>> {
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      continue;
    }

    const field = issue.path.map(String).join('.');
    const key = field as TField;
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}
