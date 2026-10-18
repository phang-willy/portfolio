package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import com.phangwilly.portfolio.dto.ServiceHealthCheckResponse;
import com.phangwilly.portfolio.dto.ServiceRestartResponse;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.ServiceHealthCheck;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ServiceRestartService {

  public static final int MAX_ATTEMPTS = 5;

  private static final Logger log = LoggerFactory.getLogger(ServiceRestartService.class);
  private static final Pattern CODE = Pattern.compile("[a-z0-9-]{1,32}");

  private final ServiceHealthProperties properties;
  private final ComposeContainerControl containers;
  private final ServiceHealthMonitor monitor;
  private final ServiceHealthRealtimeService realtimeService;
  private final ConcurrentHashMap<String, ServiceRestartResponse> progress = new ConcurrentHashMap<>();
  private final ConcurrentHashMap.KeySetView<String, Boolean> active = ConcurrentHashMap.newKeySet();

  public ServiceRestartService(
    ServiceHealthProperties properties,
    ComposeContainerControl containers,
    ServiceHealthMonitor monitor,
    ServiceHealthRealtimeService realtimeService
  ) {
    this.properties = properties;
    this.containers = containers;
    this.monitor = monitor;
    this.realtimeService = realtimeService;
  }

  public ServiceRestartResponse start(String code) {
    String composeService = requireRestartable(code);
    ServiceRestartResponse current = progress.get(code);
    if (!active.add(code)) {
      return current == null ? ServiceRestartResponse.idle(code, MAX_ATTEMPTS) : current;
    }
    ServiceRestartResponse started = new ServiceRestartResponse(
      code,
      1,
      MAX_ATTEMPTS,
      true,
      ServiceHealthCheck.DOWN
    );
    progress.put(code, started);
    Thread.startVirtualThread(() -> run(code, composeService));
    return started;
  }

  public ServiceRestartResponse progress(String code) {
    requireRestartable(code);
    return progress.getOrDefault(code, ServiceRestartResponse.idle(code, MAX_ATTEMPTS));
  }

  private void run(String code, String composeService) {
    String status = ServiceHealthCheck.DOWN;
    int finishedAttempt = 1;
    try {
      try {
        containers.restart(properties.composeProject(), composeService);
      } catch (RuntimeException exception) {
        log.warn("Could not restart {}", composeService, exception);
      }
      for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        finishedAttempt = attempt;
        progress.put(code, new ServiceRestartResponse(code, attempt, MAX_ATTEMPTS, true, status));
        if (attempt > 1) {
          if (!pause()) {
            break;
          }
        }
        try {
          monitor.check();
        } catch (RuntimeException exception) {
          log.warn("Health check failed during restart of {}", code, exception);
        }
        status = statusOf(code);
        progress.put(code, new ServiceRestartResponse(code, attempt, MAX_ATTEMPTS, true, status));
        if (ServiceHealthCheck.UP.equals(status)) {
          break;
        }
      }
    } finally {
      progress.put(code, new ServiceRestartResponse(code, finishedAttempt, MAX_ATTEMPTS, false, status));
      active.remove(code);
    }
  }

  private boolean pause() {
    try {
      Thread.sleep(properties.restartProbeDelayMillis());
      return true;
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      return false;
    }
  }

  private String statusOf(String code) {
    return realtimeService.current().stream()
      .filter(check -> code.equals(check.code()))
      .map(ServiceHealthCheckResponse::status)
      .findFirst()
      .orElse(ServiceHealthCheck.DOWN);
  }

  private String requireRestartable(String code) {
    if (code == null || !CODE.matcher(code).matches()) {
      throw notFound();
    }
    boolean known = properties.targets().stream().anyMatch(target -> code.equals(target.code()));
    if (!known) {
      throw notFound();
    }
    String composeService = properties.composeService(code);
    if (composeService == null) {
      throw new ApiException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "SERVICE_NOT_RESTARTABLE",
        "This service cannot be restarted"
      );
    }
    return composeService;
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, "SERVICE_NOT_FOUND", "Service not found");
  }
}
