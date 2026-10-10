package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.model.ServiceHealthCheck;
import java.time.Instant;

public record ServiceHealthCheckResponse(
  String code,
  String service,
  String endpoint,
  String status,
  Instant checkedAt,
  boolean restartable
) {

  public static ServiceHealthCheckResponse from(ServiceHealthCheck check, boolean restartable) {
    return new ServiceHealthCheckResponse(
      check.code(),
      check.service(),
      check.endpoint(),
      check.status(),
      check.checkedAt(),
      restartable
    );
  }
}
