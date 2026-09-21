package com.phangwilly.portfolio.model;

import com.phangwilly.portfolio.enums.ContactHistoryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "contact_history")
public class ContactHistory extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "contact_id", nullable = false)
  private Contact contact;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ContactHistoryType type;

  @Column(name = "actor_id")
  private UUID actorId;

  @Column(name = "actor_name", length = 511)
  private String actorName;

  @Column(columnDefinition = "text")
  private String subject;

  @Column(columnDefinition = "text")
  private String message;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "email_queue_id")
  private EmailQueue emailQueue;

  protected ContactHistory() {}

  private ContactHistory(
    Contact contact, ContactHistoryType type, UUID actorId, String actorName,
    String subject, String message, EmailQueue emailQueue
  ) {
    this.contact = contact;
    this.type = type;
    this.actorId = actorId;
    this.actorName = actorName;
    this.subject = subject;
    this.message = message;
    this.emailQueue = emailQueue;
  }

  public static ContactHistory read(Contact contact, UUID actorId, String actorName) {
    return new ContactHistory(contact, ContactHistoryType.READ, actorId, actorName, null, null, null);
  }

  public static ContactHistory replied(
    Contact contact, UUID actorId, String actorName, String message, EmailQueue email
  ) {
    return new ContactHistory(
      contact, ContactHistoryType.REPLIED, actorId, actorName, email.getSubject(), message, email
    );
  }

  public Contact getContact() { return contact; }

  public ContactHistoryType getType() { return type; }

  public UUID getActorId() { return actorId; }

  public String getActorName() { return actorName; }

  public String getSubject() { return subject; }

  public String getMessage() { return message; }

  public EmailQueue getEmailQueue() { return emailQueue; }
}
