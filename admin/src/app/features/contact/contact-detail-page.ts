import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationStart, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { EMPTY, Subject, catchError, concatMap, distinctUntilChanged, filter, interval, map, merge, of, switchMap, takeUntil, tap } from 'rxjs';

import { AuthStateService } from '@/app/core/auth/auth-state.service';
import { resolveApiErrorMessage } from '@/app/core/auth/auth-error-message';
import { ContactAdminDetail, ContactAdminListItem, ContactPresenceViewer } from '@/app/shared/models/contact.model';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import { ContactHistorySection } from './contact-history-section';
import { clearPresenceSessionId, isPresenceReadOnly, occupantForUser, presenceSessionId } from './contact-presence';
import { ContactReplySection } from './contact-reply-section';
import { ContactRequestSection } from './contact-request-section';
import { ContactService } from './contact.service';
import { contactStatusBadge, contactStatusLabel } from './contact-status';
import {
  clearOpenContactVisit,
  hasOpenContactVisit,
  isContactDetailUrl,
  markOpenContactVisit,
} from './contact-visit';

@Component({
  selector: 'app-contact-detail-page',
  host: { class: 'block' },
  imports: [
    AdminDatePipe, ContactHistorySection, ContactReplySection, ContactRequestSection,
    HlmAlertImports, HlmBadgeImports, HlmButtonImports, HlmIcon, HlmSpinner, NgIcon, RouterLink,
  ],
  templateUrl: './contact-detail-page.html',
})
export class ContactDetailPage {
  private readonly service = inject(ContactService);
  private readonly authState = inject(AuthStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();
  private readonly presenceSync = new Subject<{ id: string; session: string }>();
  private currentId: string | null = null;
  private presenceContactId: string | null = null;
  private presenceSession: string | null = null;
  private presenceReady = false;

  protected readonly contact = signal<ContactAdminDetail | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly historyStale = signal(false);
  protected readonly viewers = signal<readonly ContactPresenceViewer[]>([]);
  protected readonly statusLabel = contactStatusLabel;
  protected readonly statusBadge = contactStatusBadge;
  protected readonly occupant = computed(() =>
    occupantForUser(this.viewers(), this.authState.getCurrentUser()?.id),
  );
  protected readonly readOnly = computed(() =>
    isPresenceReadOnly(this.viewers(), this.authState.getCurrentUser()?.id),
  );

  constructor() {
    this.service.ensureRealtime();
    this.router.events.pipe(
      filter((event): event is NavigationStart => event instanceof NavigationStart),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      if (this.currentId && !isContactDetailUrl(event.url, this.currentId)) {
        clearOpenContactVisit(this.currentId);
        this.leavePresence();
      }
    });
    this.presenceSync.pipe(
      switchMap(({ id, session }) => this.service.heartbeat(id, session).pipe(
        catchError(() => EMPTY),
        filter((state) =>
          this.presenceContactId === id
          && this.presenceSession === session
          && state.contactId === id
        ),
        tap((state) => this.applyViewers(state.viewers)),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
    interval(15_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.syncPresence());
    this.service.presence$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.contactId === this.currentId) {
        this.applyViewers(event.viewers);
      }
    });
    this.route.paramMap.pipe(
      map((params) => params.get('id')),
      filter((id): id is string => !!id),
      distinctUntilChanged(),
      tap((id) => {
        if (this.currentId && this.currentId !== id) {
          clearOpenContactVisit(this.currentId);
          this.leavePresence();
        }
        this.currentId = id;
        this.contact.set(null);
        this.historyStale.set(false);
        this.isLoading.set(true);
      }),
      switchMap((id) => merge(
        of(!hasOpenContactVisit(id)),
        this.reload.pipe(map(() => this.contact() === null && !hasOpenContactVisit(id))),
        this.service.changes$.pipe(
          tap((item) => {
            if (item?.id === id && isExternalContactUpdate(this.contact(), item)) {
              this.historyStale.set(true);
            }
          }),
          filter((item) => item === null),
          map(() => false),
        ),
      ).pipe(concatMap((recordVisit) => {
        this.loadError.set(null);
        return (recordVisit ? this.service.markRead(id) : this.service.getContact(id)).pipe(
          tap(() => {
            if (recordVisit) {
              markOpenContactVisit(id);
            }
          }),
          catchError((error: unknown) => {
            this.loadError.set(resolveApiErrorMessage(error, 'Unable to load this contact.'));
            this.isLoading.set(false);
            return EMPTY;
          }),
        );
      }))),
      takeUntil(this.service.sessionEnded$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((contact) => {
      this.contact.set(contact);
      this.isLoading.set(false);
      this.startPresence(contact.id);
    });
    this.service.sessionEnded$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.currentId) {
        clearOpenContactVisit(this.currentId);
      }
      this.leavePresence();
      this.currentId = null;
      this.contact.set(null);
      this.loadError.set(null);
      this.historyStale.set(false);
      this.isLoading.set(false);
    });
  }

  protected refresh(): void {
    this.historyStale.set(false);
    this.reload.next();
  }

  protected onReplied(contact: ContactAdminDetail): void {
    this.contact.set(contact);
    this.historyStale.set(false);
  }

  private startPresence(id: string): void {
    if (this.presenceContactId === id) {
      return;
    }
    this.leavePresence();
    this.presenceContactId = id;
    this.presenceSession = presenceSessionId(id);
    this.syncPresence();
  }

  private syncPresence(): void {
    const id = this.presenceContactId;
    const session = this.presenceSession;
    if (!id || !session) {
      return;
    }
    this.presenceSync.next({ id, session });
  }

  private leavePresence(): void {
    const id = this.presenceContactId;
    const session = this.presenceSession;
    if (id && session) {
      this.service.leave(id, session).subscribe({ error: () => undefined });
      clearPresenceSessionId(id);
    }
    this.presenceContactId = null;
    this.presenceSession = null;
    this.presenceReady = false;
    this.viewers.set([]);
  }

  private applyViewers(viewers: readonly ContactPresenceViewer[]): void {
    const userId = this.authState.getCurrentUser()?.id;
    const previousOthers = new Set(
      this.viewers().filter((viewer) => viewer.userId !== userId).map((viewer) => viewer.userId),
    );
    const ready = this.presenceReady;
    this.viewers.set(viewers);
    this.presenceReady = true;
    if (ready && viewers.some((viewer) => viewer.userId !== userId && !previousOthers.has(viewer.userId))) {
      this.historyStale.set(true);
    }
  }
}

function isExternalContactUpdate(
  current: ContactAdminDetail | null,
  incoming: ContactAdminListItem | null,
): boolean {
  if (!incoming || !current || current.id !== incoming.id) {
    return false;
  }
  const previous = Date.parse(current.updatedAt);
  const next = Date.parse(incoming.updatedAt);
  if (Number.isNaN(previous) || Number.isNaN(next)) {
    return incoming.updatedAt !== current.updatedAt;
  }
  return next > previous;
}
