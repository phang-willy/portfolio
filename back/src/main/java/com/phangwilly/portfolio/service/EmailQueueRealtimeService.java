package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.EmailQueueRealtimeEvent;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
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
public class EmailQueueRealtimeService {

  private static final long SSE_TIMEOUT_MS = TimeUnit.HOURS.toMillis(6);
  private static final String EVENT_NAME = "email-queue";

  private final EmailQueueRepository emailQueueRepository;
  private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public EmailQueueRealtimeService(EmailQueueRepository emailQueueRepository) {
    this.emailQueueRepository = emailQueueRepository;
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
    return emitter;
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onEmailQueueChanged(EmailQueueChangedEvent event) {
    long failedCount = emailQueueRepository.countByStatus(EmailQueueStatus.FAILED);
    EmailQueueRealtimeEvent payload = new EmailQueueRealtimeEvent(event.email(), failedCount);
    emitters.forEach(emitter ->
      send(
        emitter,
        SseEmitter.event().name(EVENT_NAME).data(payload, MediaType.APPLICATION_JSON)
      )
    );
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
