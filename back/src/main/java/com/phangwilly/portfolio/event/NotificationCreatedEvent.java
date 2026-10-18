package com.phangwilly.portfolio.event;

import com.phangwilly.portfolio.dto.NotificationResponse;

public record NotificationCreatedEvent(NotificationResponse notification) {
}
