package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.model.Contact;
import java.time.Instant;
import java.util.UUID;

public record ContactAdminListItem(
  UUID id, String firstname, String lastname, String email, String subject,
  ContactStatus status, Instant createdAt, Instant updatedAt, Instant firstReadAt
) {
  public static ContactAdminListItem from(Contact contact) {
    return new ContactAdminListItem(
      contact.getId(), contact.getFirstname(), contact.getLastname(), contact.getEmail(),
      contact.getSubject(), contact.getStatus(), contact.getCreatedAt(), contact.getUpdatedAt(),
      contact.getFirstReadAt()
    );
  }
}
