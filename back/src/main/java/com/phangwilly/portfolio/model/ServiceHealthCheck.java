package com.phangwilly.portfolio.model;

import java.time.Instant;

public record ServiceHealthCheck(
  String code,
  String service,
  String endpoint,
  String status,
  Instant checkedAt
) {

  public static final String UP = "UP";
  public static final String DOWN = "DOWN";

  public boolean down() {
    return DOWN.equals(status);
  }
}
