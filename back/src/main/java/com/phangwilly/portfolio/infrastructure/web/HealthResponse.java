package com.phangwilly.portfolio.infrastructure.web;

import com.phangwilly.portfolio.domain.model.ApiStatus;
import java.time.Instant;

public record HealthResponse(String name, String status, Instant checkedAt) {

  static HealthResponse from(ApiStatus status) {
    return new HealthResponse(
      status.name(),
      status.status(),
      status.checkedAt()
    );
  }
}
