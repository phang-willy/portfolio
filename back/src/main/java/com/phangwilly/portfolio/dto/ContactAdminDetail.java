package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.model.Contact;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ContactAdminDetail(
  UUID id, String firstname, String lastname, String email, String subject,
  ContactStatus status, Instant createdAt, Instant updatedAt, Instant firstReadAt,
  Instant lastReadAt, String phone, String company, String message, List<ContactHistoryItem> history
) {
  public static ContactAdminDetail from(Contact contact, List<ContactHistoryItem> history) {
    return new ContactAdminDetail(
      contact.getId(), contact.getFirstname(), contact.getLastname(), contact.getEmail(),
      contact.getSubject(), contact.getStatus(), contact.getCreatedAt(), contact.getUpdatedAt(),
      contact.getFirstReadAt(), contact.getLastReadAt(), contact.getPhone(), contact.getCompany(),
      contact.getMessage(), List.copyOf(history)
    );
  }
}
