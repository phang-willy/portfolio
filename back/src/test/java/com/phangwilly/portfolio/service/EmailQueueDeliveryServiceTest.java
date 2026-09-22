package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.model.EmailQueueErrorEntry;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.EmailContentEncryptionService;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class EmailQueueDeliveryServiceTest {

  private static final UUID EMAIL_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final Instant NOW = Instant.parse("2026-01-01T10:00:00Z");

  @Mock
  private EmailQueueRepository emailQueueRepository;
  @Mock
  private EmailSender emailSender;
  @Mock
  private EmailContentEncryptionService encryptionService;
  @Mock
  private ApplicationEventPublisher publisher;

  private EmailQueueDeliveryService service;

  @BeforeEach
  void setUp() {
    service = new EmailQueueDeliveryService(
      emailQueueRepository,
      new EmailQueueProperties(),
      emailSender,
      encryptionService,
      publisher,
      Clock.fixed(NOW, ZoneOffset.UTC)
    );
  }

  @Test
  void deliverDecryptsHtmlAndMarksEmailSent() {
    EmailQueue email = queuedEmail(true);
    when(emailQueueRepository.findDueByIdForUpdate(EMAIL_ID, NOW)).thenReturn(Optional.of(email));
    when(encryptionService.decrypt("enc:v1:cipher")).thenReturn("<p>Réponse</p>");

    service.deliver(EMAIL_ID);

    verify(emailSender).send(new EmailMessage("user@example.com", "Contact reply", "<p>Réponse</p>", true));
    assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.SENT);
    assertThat(email.getSentAt()).isEqualTo(NOW);
    verify(emailQueueRepository).save(email);
    verify(publisher).publishEvent(any(EmailQueueChangedEvent.class));
  }

  @Test
  void deliverPreservesPlainTextEmailFormat() {
    EmailQueue email = queuedEmail(false);
    when(emailQueueRepository.findDueByIdForUpdate(EMAIL_ID, NOW)).thenReturn(Optional.of(email));
    when(encryptionService.decrypt("enc:v1:cipher")).thenReturn("https://example.com/verify?token=secret");

    service.deliver(EMAIL_ID);

    verify(emailSender).send(new EmailMessage(
      "user@example.com", "Contact reply", "https://example.com/verify?token=secret"
    ));
  }

  @Test
  void deliveryFailureAppendsHistoryAndReschedules() {
    EmailQueue email = queuedEmail(true);
    when(emailQueueRepository.findDueByIdForUpdate(EMAIL_ID, NOW)).thenReturn(Optional.of(email));
    when(encryptionService.decrypt("enc:v1:cipher")).thenReturn("<p>Réponse</p>");
    doThrow(new RuntimeException("smtp timeout")).when(emailSender).send(any());

    service.deliver(EMAIL_ID);

    assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.PENDING);
    assertThat(email.getAttempts()).isEqualTo(1);
    assertThat(email.getScheduledAt()).isEqualTo(NOW.plus(Duration.ofMinutes(5)));
    assertThat(email.getLastError()).containsExactly(new EmailQueueErrorEntry(NOW, "smtp timeout"));
    assertThat(email.isHtml()).isTrue();
  }

  @Test
  void deliveryFailureMarksFailedAtConfiguredMaximum() {
    EmailQueue email = queuedEmail(true);
    email.rescheduleAfterFailure("first", NOW, NOW);
    email.rescheduleAfterFailure("second", NOW, NOW);
    when(emailQueueRepository.findDueByIdForUpdate(EMAIL_ID, NOW)).thenReturn(Optional.of(email));
    when(encryptionService.decrypt("enc:v1:cipher")).thenReturn("<p>Réponse</p>");
    doThrow(new RuntimeException("smtp down")).when(emailSender).send(any());

    service.deliver(EMAIL_ID);

    assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.FAILED);
    assertThat(email.getAttempts()).isEqualTo(3);
    assertThat(email.getLastError()).hasSize(3);
    assertThat(email.getLastError().get(2)).isEqualTo(new EmailQueueErrorEntry(NOW, "smtp down"));
  }

  @Test
  void deliverSkipsEmailWhenNoDueUnlockedRowExists() {
    when(emailQueueRepository.findDueByIdForUpdate(EMAIL_ID, NOW)).thenReturn(Optional.empty());

    service.deliver(EMAIL_ID);

    verifyNoInteractions(emailSender, encryptionService, publisher);
  }

  private static EmailQueue queuedEmail(boolean html) {
    return new EmailQueue("user@example.com", "Contact reply", "enc:v1:cipher", html, NOW);
  }
}
