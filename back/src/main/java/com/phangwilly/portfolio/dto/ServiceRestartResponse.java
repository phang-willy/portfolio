package com.phangwilly.portfolio.dto;

public record ServiceRestartResponse(
  String code,
  int attempt,
  int maxAttempts,
  boolean running,
  String status
) {

  public static ServiceRestartResponse idle(String code, int maxAttempts) {
    return new ServiceRestartResponse(code, 0, maxAttempts, false, null);
  }
}
