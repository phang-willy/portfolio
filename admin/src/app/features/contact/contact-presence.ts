const SESSION_PREFIX = 'admin.contact.presence.session.';

export function presenceSessionStorageKey(id: string): string {
  return `${SESSION_PREFIX}${id}`;
}

export function presenceSessionId(contactId: string): string {
  const storage = readSession();
  if (!storage) {
    return crypto.randomUUID();
  }
  const existing = storage.getItem(presenceSessionStorageKey(contactId));
  if (existing) {
    return existing;
  }
  const id = crypto.randomUUID();
  storage.setItem(presenceSessionStorageKey(contactId), id);
  return id;
}

export function clearPresenceSessionId(contactId: string): void {
  readSession()?.removeItem(presenceSessionStorageKey(contactId));
}

export function occupantForUser(
  viewers: readonly { userId: string; name: string; joinedAt: string }[],
  userId: string | undefined,
): { userId: string; name: string; joinedAt: string } | null {
  return viewers.find((viewer) => viewer.userId !== userId) ?? null;
}

export function isPresenceReadOnly(
  viewers: readonly { userId: string }[],
  userId: string | undefined,
): boolean {
  return viewers.length > 0 && viewers[0]?.userId !== userId;
}

function readSession(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}
