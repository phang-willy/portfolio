package com.phangwilly.portfolio.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import com.phangwilly.portfolio.model.ServiceHealthCheck;
import com.phangwilly.portfolio.model.ServiceHealthKind;
import com.phangwilly.portfolio.model.ServiceHealthTarget;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ServiceHealthMonitorTest {

  private static final Instant NOW = Instant.parse("2026-09-24T12:00:00Z");
  private static final ServiceHealthTarget FRONT = new ServiceHealthTarget(
    "front",
    "Front",
    "http://localhost:3000",
    ServiceHealthKind.HTTP,
    "http://front-dev:3000",
    null,
    0
  );

  @Mock private ServiceHealthProperties properties;
  @Mock private ServiceHealthProbe probe;
  @Mock private ServiceHealthStateService stateService;
  @Mock private ServiceHealthRealtimeService realtimeService;
  @Mock private NotificationRealtimeService notificationRealtimeService;
  @Mock private NotificationService notificationService;

  @Test
  void notifiesAdminsOnlyOnTheTransitionToDown() {
    ServiceHealthMonitor monitor = monitor();
    when(properties.targets()).thenReturn(List.of(FRONT));
    when(stateService.load()).thenReturn(Map.of());
    when(probe.probe(any(), any())).thenReturn(down(), down(), up(), down());

    monitor.onReady();
    monitor.check();
    monitor.check();
    monitor.check();

    verify(notificationService, times(2)).notifyDown(any());
    verify(realtimeService, times(4)).broadcast(any());
  }

  @Test
  void doesNotNotifyWhenTheStoredStateIsAlreadyDown() {
    ServiceHealthMonitor monitor = monitor();
    when(properties.targets()).thenReturn(List.of(FRONT));
    when(stateService.load()).thenReturn(Map.of("front", ServiceHealthCheck.DOWN));
    when(probe.probe(any(), any())).thenReturn(down());

    monitor.onReady();

    verify(notificationService, never()).notifyDown(any());
  }

  private ServiceHealthMonitor monitor() {
    return new ServiceHealthMonitor(
      properties,
      probe,
      stateService,
      realtimeService,
      notificationRealtimeService,
      notificationService,
      Clock.fixed(NOW, ZoneOffset.UTC)
    );
  }

  private static ServiceHealthCheck down() {
    return new ServiceHealthCheck("front", "Front", "http://localhost:3000", ServiceHealthCheck.DOWN, NOW);
  }

  private static ServiceHealthCheck up() {
    return new ServiceHealthCheck("front", "Front", "http://localhost:3000", ServiceHealthCheck.UP, NOW);
  }
}
