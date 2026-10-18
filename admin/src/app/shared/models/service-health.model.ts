export interface ServiceHealthCheck {
  readonly code: string;
  readonly service: string;
  readonly endpoint: string;
  readonly status: string;
  readonly checkedAt: string;
  readonly restartable: boolean;
}

export interface ServiceRestartProgress {
  readonly code: string;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly running: boolean;
  readonly status: string | null;
}

export interface ServiceHealthSnapshot {
  readonly checks: readonly ServiceHealthCheck[];
}

export function serviceHref(endpoint: string): string | null {
  try {
    const url = new URL(endpoint);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch {
    return null;
  }
  return null;
}

export interface ServiceHealthSummary {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone: 'green' | 'amber' | 'red';
  readonly href?: string;
}
