package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.event.EmailDeliveryRequestedEvent;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.model.EmailQueueErrorEntry;
import com.phangwilly.portfolio.model.UuidPrimaryKeyEntity;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.EmailContentEncryptionService;
import java.lang.reflect.Field;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class EmailQueueServiceTest {

  private static final UUID EMAIL_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final Instant NOW = Instant.parse("2026-01-01T10:00:00Z");

  @Mock
  private EmailQueueRepository emailQueueRepository;

  @Mock
  private EmailQueueDeliveryService deliveryService;

  @Mock
  private EmailContentEncryptionService emailContentEncryptionService;

  @Mock
  private ApplicationEventPublisher applicationEventPublisher;

  private EmailQueueService service;

  @BeforeEach
  void setUp() {
    service = new EmailQueueService(
      emailQueueRepository,
      new EmailQueueProperties(),
      deliveryService,
      emailContentEncryptionService,
      applicationEventPublisher,
      Clock.fixed(NOW, ZoneOffset.UTC)
    );
  }

  @Test
  void enqueuePublishesRealtimeEventWithoutExposingBody() throws Exception {
    when(emailContentEncryptionService.encrypt("SECRET BODY")).thenReturn("enc:v1:cipher");
    when(emailQueueRepository.saveAndFlush(any(EmailQueue.class))).thenAnswer(invocation -> {
      EmailQueue email = invocation.getArgument(0);
      setId(email, EMAIL_ID);
      setField(email, "createdAt", NOW);
      return email;
    });

    service.enqueue("user@example.com", "Verify your email", "SECRET BODY");

    ArgumentCaptor<EmailQueueChangedEvent> captor = ArgumentCaptor.forClass(EmailQueueChangedEvent.class);
    verify(applicationEventPublisher).publishEvent(captor.capture());
    assertThat(captor.getValue().email().id()).isEqualTo(EMAIL_ID);
    assertThat(captor.getValue().email().recipient()).isEqualTo("user@example.com");
    assertThat(captor.getValue().email().subject()).isEqualTo("Verify your email");
    assertThat(captor.getValue().email().maxAttempts()).isEqualTo(EmailQueueProperties.DEFAULT_MAX_ATTEMPTS);
    assertThat(captor.getValue().email().lastError()).isNull();
  }

  @Test
  void processPendingEmailsDelegatesEachEmailToDeliveryWorker() {
    when(emailQueueRepository.findDueIds(
      any(),
      any(),
      any(Pageable.class)
    )).thenReturn(List.of(EMAIL_ID));

    service.processPendingEmails();

    verify(deliveryService).deliver(EMAIL_ID);
  }

  @Test
  void processPendingEmailsContinuesAfterWorkerTransactionFailure() {
    UUID secondId = UUID.randomUUID();
    when(emailQueueRepository.findDueIds(
      any(),
      any(),
      any(Pageable.class)
    )).thenReturn(List.of(EMAIL_ID, secondId));
    doThrow(new RuntimeException("database unavailable")).when(deliveryService).deliver(EMAIL_ID);

    service.processPendingEmails();

    verify(deliveryService).deliver(secondId);
  }

  @Test
  void enqueuePreservesEncryptedHtmlForRetries() {
    String body = "<h1>Réponse</h1>";
    when(emailContentEncryptionService.encrypt(body)).thenReturn("enc:v1:cipher");
    when(emailQueueRepository.saveAndFlush(any(EmailQueue.class))).thenAnswer(invocation -> invocation.getArgument(0));

    EmailQueue saved = service.enqueue(new EmailMessage("user@example.com", "Contact reply", body, true));

    assertThat(saved.getBody()).isEqualTo("enc:v1:cipher");
    assertThat(saved.isHtml()).isTrue();
    assertThat(saved.getStatus()).isEqualTo(EmailQueueStatus.PENDING);
    verifyNoInteractions(deliveryService);
  }

  @Test
  void requestDeliveryPublishesEventWithoutSendingBeforeCommit() {
    service.requestDelivery(EMAIL_ID);

    verify(applicationEventPublisher).publishEvent(new EmailDeliveryRequestedEvent(EMAIL_ID));
    verifyNoInteractions(deliveryService);
  }

  @Test
  void resendResetsFailedEmailAndKeepsHistory() throws Exception {
    EmailQueue email = queuedEmail();
    email.markFailed("smtp down", NOW);
    when(emailQueueRepository.findByIdForUpdate(EMAIL_ID)).thenReturn(Optional.of(email));
    when(emailQueueRepository.saveAndFlush(email)).thenReturn(email);

    var item = service.resend(EMAIL_ID);

    assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.PENDING);
    assertThat(email.getAttempts()).isZero();
    assertThat(item.status()).isEqualTo(EmailQueueStatus.PENDING);
    assertThat(item.lastError()).containsExactly(new EmailQueueErrorEntry(NOW, "smtp down"));
    verify(applicationEventPublisher).publishEvent(any(EmailQueueChangedEvent.class));
  }

  @Test
  void resendRejectsUnknownEmail() {
    when(emailQueueRepository.findByIdForUpdate(EMAIL_ID)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> service.resend(EMAIL_ID))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.NOT_FOUND);
  }

  @Test
  void resendRejectsNonFailedEmail() throws Exception {
    when(emailQueueRepository.findByIdForUpdate(EMAIL_ID)).thenReturn(Optional.of(queuedEmail()));

    assertThatThrownBy(() -> service.resend(EMAIL_ID))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).code())
      .isEqualTo("EMAIL_QUEUE_NOT_FAILED");
  }

  private static EmailQueue queuedEmail() throws Exception {
    EmailQueue email = new EmailQueue("user@example.com", "Verify your email", "enc:v1:cipher", NOW);
    setId(email, EMAIL_ID);
    setField(email, "createdAt", NOW);
    return email;
  }

  private static void setId(EmailQueue email, UUID id) throws Exception {
    Field field = UuidPrimaryKeyEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(email, id);
  }

  private static void setField(EmailQueue email, String name, Object value) throws Exception {
    Field field = EmailQueue.class.getDeclaredField(name);
    field.setAccessible(true);
    field.set(email, value);
  }
}
