package com.phangwilly.portfolio.model;

public record ServiceHealthTarget(
  String code,
  String service,
  String endpoint,
  ServiceHealthKind kind,
  String probe,
  String host,
  int port
) {
}
