package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.model.Notification;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
  UUID id,
  String serviceCode,
  String title,
  String message,
  Instant createdAt,
  boolean read
) {

  public static NotificationResponse from(Notification notification, boolean read) {
    return new NotificationResponse(
      notification.getId(),
      notification.getServiceCode(),
      notification.getTitle(),
      notification.getMessage(),
      notification.getCreatedAt(),
      read
    );
  }
}
