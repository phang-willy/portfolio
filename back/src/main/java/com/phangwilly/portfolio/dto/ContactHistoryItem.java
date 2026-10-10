package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.ContactHistoryType;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.ContactHistory;
import com.phangwilly.portfolio.model.EmailQueue;
import java.time.Instant;
import java.util.UUID;

public record ContactHistoryItem(
  UUID id, ContactHistoryType type, Instant createdAt, UUID actorId, String actorName,
  String subject, String message, UUID emailQueueId, EmailQueueStatus emailStatus, Instant sentAt
) {
  public static ContactHistoryItem received(Contact contact) {
    return new ContactHistoryItem(
      contact.getId(), ContactHistoryType.RECEIVED, contact.getCreatedAt(), null, null,
      contact.getSubject(), contact.getMessage(), null, null, null
    );
  }

  public static ContactHistoryItem from(ContactHistory history) {
    EmailQueue email = history.getEmailQueue();
    return new ContactHistoryItem(
      history.getId(), history.getType(), history.getCreatedAt(), history.getActorId(),
      history.getActorName(), history.getSubject(), history.getMessage(),
      email == null ? null : email.getId(), email == null ? null : email.getStatus(),
      email == null ? null : email.getSentAt()
    );
  }
}
