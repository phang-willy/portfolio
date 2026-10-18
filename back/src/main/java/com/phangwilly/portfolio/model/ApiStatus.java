package com.phangwilly.portfolio.model;

import java.time.Clock;
import java.time.Instant;

public record ApiStatus(String name, String status, Instant checkedAt) {

  public static ApiStatus up(String name, Clock clock) {
    return new ApiStatus(name, "UP", Instant.now(clock));
  }
}
