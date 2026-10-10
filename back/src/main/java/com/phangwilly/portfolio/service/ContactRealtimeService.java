package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ContactAdminListItem;
import com.phangwilly.portfolio.dto.ContactPresenceEvent;
import com.phangwilly.portfolio.dto.ContactRealtimeEvent;
import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.event.ContactChangedEvent;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.repository.ContactHistoryRepository;
import com.phangwilly.portfolio.repository.ContactRepository;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class ContactRealtimeService {

  private static final long SSE_TIMEOUT_MS = TimeUnit.HOURS.toMillis(6);
  private final ContactRepository contactRepository;
  private final ContactHistoryRepository historyRepository;
  private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public ContactRealtimeService(ContactRepository contactRepository, ContactHistoryRepository historyRepository) {
    this.contactRepository = contactRepository;
    this.historyRepository = historyRepository;
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
  @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
  public void onContactChanged(ContactChangedEvent event) {
    broadcast(event.contact());
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
  public void onEmailQueueChanged(EmailQueueChangedEvent event) {
    historyRepository.findContactByEmailQueueId(event.email().id())
      .ifPresent(contact -> broadcast(ContactAdminListItem.from(contact)));
  }

  @Scheduled(fixedDelayString = "15000")
  public void heartbeat() {
    emitters.forEach(emitter -> send(emitter, SseEmitter.event().comment("keepalive")));
  }

  private void broadcast(ContactAdminListItem contact) {
    long count = contactRepository.countByStatusAndDeletedAtIsNull(ContactStatus.RECEIVED);
    ContactRealtimeEvent payload = new ContactRealtimeEvent(contact, count);
    emitters.forEach(emitter -> send(
      emitter, SseEmitter.event().name("contact").data(payload, MediaType.APPLICATION_JSON)
    ));
  }

  public void broadcastPresence(ContactPresenceEvent payload) {
    emitters.forEach(emitter -> send(
      emitter, SseEmitter.event().name("presence").data(payload, MediaType.APPLICATION_JSON)
    ));
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
