package com.phangwilly.portfolio.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class GetApiStatusServiceTest {

  @Test
  void returnsCurrentApiStatus() {
    Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);

    var status = new GetApiStatusService(clock).getStatus();

    assertThat(status.name()).isEqualTo("portfolio-api");
    assertThat(status.status()).isEqualTo("UP");
    assertThat(status.checkedAt()).isEqualTo(Instant.parse("2026-01-01T00:00:00Z"));
  }
}
