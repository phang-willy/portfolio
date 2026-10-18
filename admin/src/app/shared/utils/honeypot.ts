export const HONEYPOT_FIELD_NAME = 'website' as const;

export function isHoneypotFilled(value: string | null | undefined): boolean {
  return (value ?? '').trim().length > 0;
}
