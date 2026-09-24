package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import com.phangwilly.portfolio.model.ServiceHealthCheck;
import com.phangwilly.portfolio.model.ServiceHealthTarget;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class ServiceHealthMonitor {

  private static final Logger log = LoggerFactory.getLogger(ServiceHealthMonitor.class);

  private final ServiceHealthProperties properties;
  private final ServiceHealthProbe probe;
  private final ServiceHealthTracker tracker = new ServiceHealthTracker();
  private final ServiceHealthStateService stateService;
  private final ServiceHealthRealtimeService realtimeService;
  private final NotificationRealtimeService notificationRealtimeService;
  private final NotificationService notificationService;
  private final Clock clock;
  private final AtomicBoolean started = new AtomicBoolean(false);
  private Instant notificationsFrom = Instant.EPOCH;

  public ServiceHealthMonitor(
    ServiceHealthProperties properties,
    ServiceHealthProbe probe,
    ServiceHealthStateService stateService,
    ServiceHealthRealtimeService realtimeService,
    NotificationRealtimeService notificationRealtimeService,
    NotificationService notificationService,
    Clock clock
  ) {
    this.properties = properties;
    this.probe = probe;
    this.stateService = stateService;
    this.realtimeService = realtimeService;
    this.notificationRealtimeService = notificationRealtimeService;
    this.notificationService = notificationService;
    this.clock = clock;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void onReady() {
    try {
      tracker.restore(stateService.load());
    } catch (RuntimeException exception) {
      log.warn("Could not restore service health state", exception);
    }
    started.set(true);
    long graceMillis = properties.startupGraceMillis();
    notificationsFrom = graceMillis <= 0 ? Instant.EPOCH : Instant.now(clock).plusMillis(graceMillis);
    check();
  }

  @Scheduled(fixedDelayString = "${app.service-health.interval-millis:15000}")
  public void scheduledCheck() {
    if (started.get()) {
      check();
    }
  }

  public void check() {
    synchronized (this) {
      List<ServiceHealthCheck> checks;
      try {
        checks = probeAll(Instant.now(clock));
      } catch (InterruptedException exception) {
        Thread.currentThread().interrupt();
        return;
      } catch (RuntimeException exception) {
        log.warn("Service health check aborted", exception);
        return;
      }
      realtimeService.broadcast(checks);
      if (Instant.now(clock).isBefore(notificationsFrom)) {
        tracker.recordRecoveries(checks);
        return;
      }
      List<ServiceHealthCheck> failures = tracker.record(checks);
      try {
        stateService.save(checks);
      } catch (RuntimeException exception) {
        log.warn("Could not store service health state", exception);
      }
      if (!failures.isEmpty()) {
        log.warn(
          "Service health degraded: {}",
          failures.stream().map(ServiceHealthCheck::endpoint).toList()
        );
      }
      for (ServiceHealthCheck failure : failures) {
        try {
          notificationService.notifyDown(failure);
        } catch (RuntimeException exception) {
          log.warn("Could not store the {} outage notification", failure.service(), exception);
          notificationRealtimeService.broadcast(notificationService.unsaved(failure));
        }
      }
    }
  }

  private List<ServiceHealthCheck> probeAll(Instant checkedAt) throws InterruptedException {
    List<ServiceHealthTarget> targets = properties.targets();
    if (targets.isEmpty()) {
      return List.of();
    }
    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
      List<Future<ServiceHealthCheck>> futures = new ArrayList<>();
      for (ServiceHealthTarget target : targets) {
        futures.add(executor.submit(() -> probe.probe(target, checkedAt)));
      }
      List<ServiceHealthCheck> checks = new ArrayList<>();
      for (Future<ServiceHealthCheck> future : futures) {
        checks.add(await(future));
      }
      return List.copyOf(checks);
    }
  }

  private static ServiceHealthCheck await(Future<ServiceHealthCheck> future) throws InterruptedException {
    try {
      return future.get();
    } catch (ExecutionException exception) {
      throw new IllegalStateException("Service health probe failed", exception.getCause());
    }
  }
}
