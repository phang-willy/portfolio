export function notificationBadgeLabel(count: number): string | null {
  if (count <= 0) {
    return null;
  }
  return count >= 10 ? '10+' : String(count);
}
