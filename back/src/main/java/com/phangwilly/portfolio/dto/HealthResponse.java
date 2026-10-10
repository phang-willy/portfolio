package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.model.ApiStatus;
import java.time.Instant;

public record HealthResponse(String name, String status, Instant checkedAt) {

  public static HealthResponse from(ApiStatus status) {
    return new HealthResponse(
      status.name(),
      status.status(),
      status.checkedAt()
    );
  }
}
