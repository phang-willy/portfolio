package com.phangwilly.portfolio.model;

import com.phangwilly.portfolio.enums.ContactStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "contact")
public class Contact extends AuditableEntity {

  @Column(nullable = false, length = 255)
  private String firstname;

  @Column(nullable = false, length = 255)
  private String lastname;

  @Column(nullable = false, length = 320)
  private String email;

  @Column(length = 50)
  private String phone;

  @Column(length = 255)
  private String company;

  @Column(nullable = false, length = 255)
  private String subject;

  @Column(nullable = false, columnDefinition = "text")
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ContactStatus status = ContactStatus.RECEIVED;

  @Column(name = "first_read_at")
  private Instant firstReadAt;

  @Column(name = "last_read_at")
  private Instant lastReadAt;

  protected Contact() {}

  public Contact(
    String firstname, String lastname, String email, String phone,
    String company, String subject, String message
  ) {
    this.firstname = firstname;
    this.lastname = lastname;
    this.email = email;
    this.phone = phone;
    this.company = company;
    this.subject = subject;
    this.message = message;
  }

  public String getFirstname() { return firstname; }

  public String getLastname() { return lastname; }

  public String getEmail() { return email; }

  public String getPhone() { return phone; }

  public String getCompany() { return company; }

  public String getSubject() { return subject; }

  public String getMessage() { return message; }

  public ContactStatus getStatus() { return status; }

  public Instant getFirstReadAt() { return firstReadAt; }

  public Instant getLastReadAt() { return lastReadAt; }

  public void markRead(Instant at) {
    lastReadAt = at;
    if (firstReadAt == null) {
      firstReadAt = at;
    }
    if (status == ContactStatus.RECEIVED) {
      status = ContactStatus.READ;
    }
  }

  public void markReplied(Instant at) {
    markRead(at);
    status = ContactStatus.REPLIED;
  }
}
