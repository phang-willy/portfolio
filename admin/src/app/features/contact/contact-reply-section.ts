import { Component, DestroyRef, ElementRef, afterRenderEffect, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { HlmTextareaImports } from '@spartan-ng/helm/textarea';
import { finalize, startWith, takeUntil } from 'rxjs';

import { AdminAccessService } from '@/app/core/auth/admin-access.service';
import { resolveApiErrorMessage } from '@/app/core/auth/auth-error-message';
import { AuthHoneypotFieldComponent } from '@/app/shared/components/auth-honeypot-field/auth-honeypot-field.component';
import { ContactAdminDetail } from '@/app/shared/models/contact.model';
import { AdminDatePipe } from '@/app/shared/pipes/admin-date.pipe';
import { isHoneypotFilled } from '@/app/shared/utils/honeypot';
import { environment } from '@/environments/environment';
import { ContactService } from './contact.service';

export const CONTACT_REPLY_MAX = 20_000;
export const CONTACT_REPLY_WARN = 20;
const CIRCLE_RADIUS = 10;
const CIRCLE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS;

@Component({
  selector: 'app-contact-reply-section',
  host: { class: 'block min-w-0' },
  imports: [
    AdminDatePipe, AuthHoneypotFieldComponent, HlmButtonImports, HlmIcon,
    HlmSpinner, HlmTextareaImports, NgIcon, ReactiveFormsModule,
  ],
  templateUrl: './contact-reply-section.html',
})
export class ContactReplySection {
  private readonly service = inject(ContactService);
  private readonly adminAccess = inject(AdminAccessService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly contact = input.required<ContactAdminDetail>();
  readonly readOnly = input(false);
  readonly replied = output<ContactAdminDetail>();

  protected readonly isSending = signal(false);
  protected readonly replyError = signal<string | null>(null);
  protected readonly replySuccess = signal(false);
  protected readonly replySubject = computed(
    () => `${environment.appTitle} - SUITE : ${this.contact().subject}`,
  );
  protected readonly replyForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.required, Validators.maxLength(CONTACT_REPLY_MAX), Validators.pattern(/\S/)]],
    website: [''],
  });
  protected readonly draft = toSignal(
    this.replyForm.controls.message.valueChanges.pipe(startWith(this.replyForm.controls.message.value)),
    { initialValue: '' },
  );
  protected readonly remaining = computed(() => CONTACT_REPLY_MAX - this.draft().length);
  protected readonly warnAt = CONTACT_REPLY_WARN;
  protected readonly showCount = computed(() => this.remaining() <= CONTACT_REPLY_WARN);
  protected readonly overLimit = computed(() => this.remaining() < 0);
  protected readonly allowedText = computed(() => this.draft().slice(0, CONTACT_REPLY_MAX));
  protected readonly overflowText = computed(() => this.draft().slice(CONTACT_REPLY_MAX));
  protected readonly circleLength = CIRCLE_LENGTH;
  protected readonly circleOffset = computed(
    () => CIRCLE_LENGTH * (1 - Math.min(this.draft().length / CONTACT_REPLY_MAX, 1)),
  );
  private readonly replyMessage = viewChild<ElementRef<HTMLTextAreaElement>>('replyMessage');
  private readonly overflowOverlay = viewChild<ElementRef<HTMLElement>>('overflowOverlay');

  constructor() {
    afterRenderEffect(() => {
      this.draft();
      this.overLimit();
      this.syncOverflowScroll();
    });
  }

  protected onDraftScroll(): void {
    this.syncOverflowScroll();
  }

  private syncOverflowScroll(): void {
    const source = nativeElement(this.replyMessage());
    const overlay = nativeElement(this.overflowOverlay());
    if (!source || !overlay) {
      return;
    }
    overlay.scrollTop = source.scrollTop;
    overlay.scrollLeft = source.scrollLeft;
  }

  protected sendReply(): void {
    if (this.isSending() || this.overLimit() || this.readOnly()) {
      return;
    }
    this.replyForm.markAllAsTouched();
    if (this.replyForm.invalid || isHoneypotFilled(this.replyForm.getRawValue().website)) {
      return;
    }
    if (!this.adminAccess.isAdmin()) {
      this.replyError.set('Only administrators can perform this action.');
      return;
    }
    this.replyError.set(null);
    this.replySuccess.set(false);
    this.isSending.set(true);
    const payload = this.replyForm.getRawValue();
    this.replyForm.disable();
    this.service.reply(this.contact().id, payload).pipe(
      takeUntil(this.service.sessionEnded$),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.isSending.set(false);
        this.replyForm.enable();
      }),
    ).subscribe({
      next: (updated) => {
        this.replied.emit(updated);
        this.replyForm.reset();
        this.replySuccess.set(true);
      },
      error: (error: unknown) => {
        this.replyError.set(resolveApiErrorMessage(error, 'Unable to send your reply. Your draft has been kept.'));
      },
    });
  }
}

function nativeElement<T extends HTMLElement>(value: T | ElementRef<T> | undefined): T | undefined {
  if (!value) {
    return undefined;
  }
  return value instanceof HTMLElement ? value : value.nativeElement;
}
