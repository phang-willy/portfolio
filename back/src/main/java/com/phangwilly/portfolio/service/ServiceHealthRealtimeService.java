package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import com.phangwilly.portfolio.dto.ServiceHealthCheckResponse;
import com.phangwilly.portfolio.dto.ServiceHealthSnapshotResponse;
import com.phangwilly.portfolio.model.ServiceHealthCheck;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class ServiceHealthRealtimeService {

  private static final long SSE_TIMEOUT_MS = TimeUnit.HOURS.toMillis(6);
  static final String EVENT_NAME = "service-health";

  private final ServiceHealthProperties properties;
  private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
  private final AtomicReference<List<ServiceHealthCheckResponse>> latest = new AtomicReference<>(List.of());

  public ServiceHealthRealtimeService(ServiceHealthProperties properties) {
    this.properties = properties;
  }

  public SseEmitter subscribe() {
    SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
    emitters.add(emitter);
    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> {
      emitters.remove(emitter);
      emitter.complete();
    });
    emitter.onError(error -> emitters.remove(emitter));
    List<ServiceHealthCheckResponse> current = latest.get();
    if (!current.isEmpty()) {
      send(emitter, snapshotEvent(current));
    }
    return emitter;
  }

  public List<ServiceHealthCheckResponse> current() {
    return latest.get();
  }

  public void broadcast(List<ServiceHealthCheck> checks) {
    List<ServiceHealthCheckResponse> payload = checks.stream()
      .map(check -> ServiceHealthCheckResponse.from(check, properties.restartable(check.code())))
      .toList();
    latest.set(payload);
    emitters.forEach(emitter -> send(emitter, snapshotEvent(payload)));
  }

  @Scheduled(fixedDelayString = "15000")
  public void heartbeat() {
    emitters.forEach(emitter -> send(emitter, SseEmitter.event().comment("keepalive")));
  }

  private static SseEmitter.SseEventBuilder snapshotEvent(List<ServiceHealthCheckResponse> checks) {
    return SseEmitter.event()
      .name(EVENT_NAME)
      .data(new ServiceHealthSnapshotResponse(checks), MediaType.APPLICATION_JSON);
  }

  private void send(SseEmitter emitter, SseEmitter.SseEventBuilder event) {
    try {
      emitter.send(event);
    } catch (Exception exception) {
      emitters.remove(emitter);
      try {
        emitter.complete();
      } catch (Exception ignored) {
      }
    }
  }
}
