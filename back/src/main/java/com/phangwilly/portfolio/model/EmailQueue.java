package com.phangwilly.portfolio.model;

import com.phangwilly.portfolio.enums.EmailQueueStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "email_queue")
public class EmailQueue extends UuidPrimaryKeyEntity {

  private static final int RECIPIENT_MAX_LENGTH = 320;
  private static final int SUBJECT_MAX_LENGTH = 255;
  private static final int STATUS_MAX_LENGTH = 20;
  private static final int ERROR_HISTORY_MAX_ENTRIES = 50;

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

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "last_error", columnDefinition = "jsonb")
  private List<EmailQueueErrorEntry> lastError;

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

  public List<EmailQueueErrorEntry> getLastError() {
    return lastError == null ? List.of() : List.copyOf(lastError);
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
  }

  public void markFailed(String lastError, Instant at) {
    this.status = EmailQueueStatus.FAILED;
    this.attempts++;
    appendError(lastError, at);
  }

  public void rescheduleAfterFailure(String lastError, Instant at, Instant scheduledAt) {
    this.status = EmailQueueStatus.PENDING;
    this.attempts++;
    appendError(lastError, at);
    this.scheduledAt = scheduledAt;
  }

  public void resend(Instant now) {
    this.status = EmailQueueStatus.PENDING;
    this.attempts = 0;
    this.sentAt = null;
    this.scheduledAt = now;
  }

  private void appendError(String message, Instant at) {
    List<EmailQueueErrorEntry> history = lastError == null ? new ArrayList<>() : new ArrayList<>(lastError);
    history.add(new EmailQueueErrorEntry(at, message));
    if (history.size() > ERROR_HISTORY_MAX_ENTRIES) {
      history.subList(0, history.size() - ERROR_HISTORY_MAX_ENTRIES).clear();
    }
    this.lastError = history;
  }
}
