package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.NotificationResponse;
import com.phangwilly.portfolio.event.NotificationCreatedEvent;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class NotificationRealtimeService {

  private static final long SSE_TIMEOUT_MS = TimeUnit.HOURS.toMillis(6);
  static final String EVENT_NAME = "notification";

  private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public SseEmitter subscribe() {
    SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
    emitters.add(emitter);
    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> {
      emitters.remove(emitter);
      emitter.complete();
    });
    emitter.onError(error -> emitters.remove(emitter));
    return emitter;
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onNotificationCreated(NotificationCreatedEvent event) {
    broadcast(event.notification());
  }

  public void broadcast(NotificationResponse notification) {
    emitters.forEach(emitter -> send(
      emitter,
      SseEmitter.event().name(EVENT_NAME).data(notification, MediaType.APPLICATION_JSON)
    ));
  }

  @Scheduled(fixedDelayString = "15000")
  public void heartbeat() {
    emitters.forEach(emitter -> send(emitter, SseEmitter.event().comment("keepalive")));
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
