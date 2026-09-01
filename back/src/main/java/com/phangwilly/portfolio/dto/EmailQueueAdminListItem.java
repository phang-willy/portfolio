package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.model.EmailQueueErrorEntry;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EmailQueueAdminListItem(
  UUID id,
  String recipient,
  String subject,
  EmailQueueStatus status,
  int attempts,
  int maxAttempts,
  List<EmailQueueErrorEntry> lastError,
  Instant scheduledAt,
  Instant sentAt,
  Instant createdAt
) {

  public static EmailQueueAdminListItem from(EmailQueue email) {
    return from(email, EmailQueueProperties.DEFAULT_MAX_ATTEMPTS);
  }

  public static EmailQueueAdminListItem from(EmailQueue email, int maxAttempts) {
    List<EmailQueueErrorEntry> errors = email.getLastError();
    return new EmailQueueAdminListItem(
      email.getId(),
      email.getRecipient(),
      email.getSubject(),
      email.getStatus(),
      email.getAttempts(),
      maxAttempts,
      errors.isEmpty() ? null : errors,
      email.getScheduledAt(),
      email.getSentAt(),
      email.getCreatedAt()
    );
  }
}
