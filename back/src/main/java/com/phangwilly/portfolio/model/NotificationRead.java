package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "notification_read")
public class NotificationRead {

  @EmbeddedId
  private NotificationReadId id;

  @Column(name = "read_at", nullable = false)
  private Instant readAt;

  protected NotificationRead() {
  }

  public NotificationRead(NotificationReadId id, Instant readAt) {
    this.id = id;
    this.readAt = readAt;
  }

  public NotificationReadId getId() {
    return id;
  }
}
