package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.model.ServiceHealthCheck;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ServiceHealthTrackerTest {

  private final ServiceHealthTracker tracker = new ServiceHealthTracker();
  private final Instant checkedAt = Instant.parse("2026-09-24T12:00:00Z");

  @Test
  void notifiesOnlyWhenAServiceStartsFailing() {
    ServiceHealthCheck api = check("api", "API", ServiceHealthCheck.UP);
    ServiceHealthCheck front = check("front", "Front", ServiceHealthCheck.DOWN);

    assertThat(tracker.record(java.util.List.of(api, front))).containsExactly(front);
    assertThat(tracker.record(java.util.List.of(api, front))).isEmpty();

    ServiceHealthCheck recovered = check("front", "Front", ServiceHealthCheck.UP);
    assertThat(tracker.record(java.util.List.of(api, recovered))).isEmpty();

    ServiceHealthCheck downAgain = check("front", "Front", ServiceHealthCheck.DOWN);
    assertThat(tracker.record(java.util.List.of(api, downAgain))).containsExactly(downAgain);
  }

  @Test
  void doesNotNotifyAgainWhenThePreviousStateWasAlreadyDown() {
    tracker.restore(Map.of("smtp", ServiceHealthCheck.DOWN));

    assertThat(tracker.record(java.util.List.of(check("smtp", "SMTP", ServiceHealthCheck.DOWN)))).isEmpty();
  }

  private ServiceHealthCheck check(String code, String service, String status) {
    return new ServiceHealthCheck(code, service, "localhost", status, checkedAt);
  }
}
