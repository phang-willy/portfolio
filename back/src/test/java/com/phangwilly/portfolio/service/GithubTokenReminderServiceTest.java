package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.BrevoProperties;
import com.phangwilly.portfolio.enums.EmailChannel;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.model.UuidPrimaryKeyEntity;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import java.lang.reflect.Field;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class GithubTokenReminderServiceTest {

  private static final Instant NOW = Instant.parse("2026-09-30T02:05:00Z");
  private static final Instant EXPIRATION = Instant.parse("2026-10-01T08:00:00Z");
  private static final UUID EMAIL_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  @Mock
  private GithubTokenExpirationClient expirationClient;
  @Mock
  private EmailQueueRepository emailQueueRepository;
  @Mock
  private EmailQueueService emailQueueService;

  private GithubTokenReminderService service;
  private JsonMapper json;

  @BeforeEach
  void setUp() {
    BrevoProperties brevo = new BrevoProperties();
    brevo.setContactToEmail("owner@example.test");
    json = JsonMapper.builder().build();
    service = new GithubTokenReminderService(
      expirationClient,
      emailQueueRepository,
      emailQueueService,
      brevo,
      json,
      Clock.fixed(NOW, ZoneOffset.UTC)
    );
  }

  @Test
  void queuesABrevoReminderTheDayBeforeExpiration() throws Exception {
    when(expirationClient.currentExpiration()).thenReturn(Optional.of(EXPIRATION));
    when(emailQueueRepository.existsByRecipientAndSubjectAndCreatedAtGreaterThanEqual(
      "owner@example.test",
      GithubTokenReminderService.SUBJECT,
      Instant.parse("2026-09-30T00:00:00Z")
    )).thenReturn(false);
    EmailQueue email = new EmailQueue("owner@example.test", GithubTokenReminderService.SUBJECT, "enc", false, NOW);
    setId(email, EMAIL_ID);
    when(emailQueueService.enqueue(any(EmailMessage.class), eq(EmailChannel.BREVO))).thenReturn(email);

    service.queueIfDue();

    ArgumentCaptor<EmailMessage> message = ArgumentCaptor.forClass(EmailMessage.class);
    verify(emailQueueService).enqueue(message.capture(), eq(EmailChannel.BREVO));
    assertThat(message.getValue().recipient()).isEqualTo("owner@example.test");
    assertThat(message.getValue().subject()).isEqualTo(GithubTokenReminderService.SUBJECT);
    BrevoTemplatePayload payload = json.readValue(message.getValue().body(), BrevoTemplatePayload.class);
    assertThat(payload.plainText()).isTrue();
    assertThat(payload.templateId()).isZero();
    assertThat(payload.textContent()).contains("va expirer demain");
    verify(emailQueueService).requestDelivery(EMAIL_ID);
  }

  @Test
  void doesNotQueueOutsideTheReminderDay() {
    when(expirationClient.currentExpiration()).thenReturn(Optional.of(Instant.parse("2026-10-05T08:00:00Z")));

    service.queueIfDue();

    verify(emailQueueService, never()).enqueue(any(EmailMessage.class), any());
    verifyNoInteractions(emailQueueRepository);
  }

  @Test
  void doesNotQueueTwiceTheSameDay() {
    when(expirationClient.currentExpiration()).thenReturn(Optional.of(EXPIRATION));
    when(emailQueueRepository.existsByRecipientAndSubjectAndCreatedAtGreaterThanEqual(
      any(), any(), any()
    )).thenReturn(true);

    service.queueIfDue();

    verifyNoInteractions(emailQueueService);
  }

  private static void setId(EmailQueue email, UUID id) throws Exception {
    Field field = UuidPrimaryKeyEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(email, id);
  }
}
