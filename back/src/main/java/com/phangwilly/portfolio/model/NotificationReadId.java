package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class NotificationReadId implements Serializable {

  @Column(name = "notification_id", nullable = false, columnDefinition = "uuid")
  private UUID notificationId;

  @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
  private UUID userId;

  protected NotificationReadId() {
  }

  public NotificationReadId(UUID notificationId, UUID userId) {
    this.notificationId = notificationId;
    this.userId = userId;
  }

  public UUID getNotificationId() {
    return notificationId;
  }

  public UUID getUserId() {
    return userId;
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    }
    if (!(other instanceof NotificationReadId that)) {
      return false;
    }
    return Objects.equals(notificationId, that.notificationId) && Objects.equals(userId, that.userId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(notificationId, userId);
  }
}
