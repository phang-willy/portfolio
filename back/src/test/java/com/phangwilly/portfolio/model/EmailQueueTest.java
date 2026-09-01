package com.phangwilly.portfolio.model;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.enums.EmailQueueStatus;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class EmailQueueTest {

  private static final Instant NOW = Instant.parse("2026-01-01T10:00:00Z");
  private static final Instant LATER = Instant.parse("2026-01-01T10:05:00Z");

  @Test
  void appendsFailuresToLastErrorHistory() {
    EmailQueue email = new EmailQueue("user@example.com", "Verify your email", "body", NOW);

    email.rescheduleAfterFailure("smtp timeout", NOW, LATER);
    email.markFailed("mailbox full", LATER);

    assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.FAILED);
    assertThat(email.getAttempts()).isEqualTo(2);
    assertThat(email.getLastError())
      .containsExactly(
        new EmailQueueErrorEntry(NOW, "smtp timeout"),
        new EmailQueueErrorEntry(LATER, "mailbox full")
      );
  }

  @Test
  void markSentKeepsErrorHistory() {
    EmailQueue email = new EmailQueue("user@example.com", "Verify your email", "body", NOW);
    email.rescheduleAfterFailure("temporary", NOW, LATER);
    email.markSent(LATER);

    assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.SENT);
    assertThat(email.getLastError()).containsExactly(new EmailQueueErrorEntry(NOW, "temporary"));
  }

  @Test
  void resendResetsAttemptsAndKeepsHistory() {
    EmailQueue email = new EmailQueue("user@example.com", "Verify your email", "body", NOW);
    email.markFailed("smtp down", NOW);

    email.resend(LATER);

    assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.PENDING);
    assertThat(email.getAttempts()).isZero();
    assertThat(email.getSentAt()).isNull();
    assertThat(email.getScheduledAt()).isEqualTo(LATER);
    assertThat(email.getLastError()).containsExactly(new EmailQueueErrorEntry(NOW, "smtp down"));
  }
}
