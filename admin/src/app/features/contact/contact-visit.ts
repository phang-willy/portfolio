const VISIT_PREFIX = 'admin.contact.visit.';

export function contactVisitStorageKey(id: string): string {
  return `${VISIT_PREFIX}${id}`;
}

export function hasOpenContactVisit(id: string): boolean {
  return readSession()?.getItem(contactVisitStorageKey(id)) === '1';
}

export function markOpenContactVisit(id: string): void {
  readSession()?.setItem(contactVisitStorageKey(id), '1');
}

export function clearOpenContactVisit(id: string): void {
  readSession()?.removeItem(contactVisitStorageKey(id));
}

export function isContactDetailUrl(url: string, id: string): boolean {
  const path = url.split(/[?#]/, 1)[0]?.replace(/\/+$/, '') ?? '';
  return path === `/admin/contact/${id}` || path.endsWith(`/admin/contact/${id}`);
}

function readSession(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}
