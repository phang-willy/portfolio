package com.phangwilly.portfolio.model;

import com.phangwilly.portfolio.enums.EmailQueueStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "email_queue")
public class EmailQueue extends UuidPrimaryKeyEntity {

  private static final int RECIPIENT_MAX_LENGTH = 320;
  private static final int SUBJECT_MAX_LENGTH = 255;
  private static final int STATUS_MAX_LENGTH = 20;

  @Column(nullable = false, length = RECIPIENT_MAX_LENGTH)
  private String recipient;

  @Column(nullable = false, length = SUBJECT_MAX_LENGTH)
  private String subject;

  @Column(nullable = false, columnDefinition = "text")
  private String body;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = STATUS_MAX_LENGTH)
  private EmailQueueStatus status = EmailQueueStatus.PENDING;

  @Column(nullable = false)
  private int attempts;

  @Column(name = "last_error", columnDefinition = "text")
  private String lastError;

  @Column(name = "scheduled_at", nullable = false)
  private Instant scheduledAt;

  @Column(name = "sent_at")
  private Instant sentAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected EmailQueue() {
  }

  public EmailQueue(String recipient, String subject, String body, Instant scheduledAt) {
    this.recipient = recipient;
    this.subject = subject;
    this.body = body;
    this.scheduledAt = scheduledAt;
  }

  public String getRecipient() {
    return recipient;
  }

  public String getSubject() {
    return subject;
  }

  public String getBody() {
    return body;
  }

  public EmailQueueStatus getStatus() {
    return status;
  }

  public int getAttempts() {
    return attempts;
  }

  public String getLastError() {
    return lastError;
  }

  public Instant getScheduledAt() {
    return scheduledAt;
  }

  public Instant getSentAt() {
    return sentAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void markSent(Instant sentAt) {
    this.status = EmailQueueStatus.SENT;
    this.sentAt = sentAt;
    this.lastError = null;
  }

  public void markFailed(String lastError) {
    this.status = EmailQueueStatus.FAILED;
    this.attempts++;
    this.lastError = lastError;
  }

  public void rescheduleAfterFailure(String lastError, Instant scheduledAt) {
    this.status = EmailQueueStatus.PENDING;
    this.attempts++;
    this.lastError = lastError;
    this.scheduledAt = scheduledAt;
  }
}
