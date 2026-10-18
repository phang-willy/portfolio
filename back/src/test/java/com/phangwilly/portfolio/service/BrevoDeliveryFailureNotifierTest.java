package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.BrevoProperties;
import com.phangwilly.portfolio.enums.ContactHistoryType;
import com.phangwilly.portfolio.enums.EmailChannel;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.ContactHistory;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.model.UuidPrimaryKeyEntity;
import com.phangwilly.portfolio.repository.ContactHistoryRepository;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BrevoDeliveryFailureNotifierTest {

  private static final UUID FAILED_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID ALERT_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final Instant NOW = Instant.parse("2026-01-01T10:00:00Z");

  @Mock
  private EmailQueueService emailQueueService;
  @Mock
  private ContactHistoryRepository historyRepository;

  private BrevoProperties properties;
  private BrevoDeliveryFailureNotifier notifier;

  @BeforeEach
  void setUp() {
    properties = new BrevoProperties();
    properties.setContactToEmail("owner@example.test");
    notifier = new BrevoDeliveryFailureNotifier(emailQueueService, historyRepository, properties);
  }

  @Test
  void queuesAnSmtpNoticeAndLinksItToTheContact() throws Exception {
    Contact contact = new Contact(
      "Léa", "Martin", "lea@example.test", "0600000000", "Atelier", "Projet", "Bonjour"
    );
    EmailQueue failed = brevoEmail();
    EmailQueue alert = new EmailQueue("owner@example.test", "notice", "enc", false, NOW);
    setId(alert, ALERT_ID);
    when(historyRepository.findContactByEmailQueueId(FAILED_ID)).thenReturn(Optional.of(contact));
    when(emailQueueService.enqueue(any(EmailMessage.class))).thenReturn(alert);

    notifier.notify(failed, "Brevo rejected the email (HTTP 401)");

    ArgumentCaptor<EmailMessage> message = ArgumentCaptor.forClass(EmailMessage.class);
    verify(emailQueueService).enqueue(message.capture());
    assertThat(message.getValue().recipient()).isEqualTo("owner@example.test");
    assertThat(message.getValue().html()).isFalse();
    assertThat(message.getValue().body())
      .contains("n'a pas pu être envoyée par Brevo")
      .contains("Léa Martin <lea@example.test>")
      .contains("Projet")
      .contains("HTTP 401")
      .contains("Bonjour")
      .contains("relance la procédure Brevo");

    ArgumentCaptor<ContactHistory> history = ArgumentCaptor.forClass(ContactHistory.class);
    verify(historyRepository).save(history.capture());
    assertThat(history.getValue().getType()).isEqualTo(ContactHistoryType.CONFIRMATION);
    assertThat(history.getValue().getActorName()).isEqualTo(BrevoDeliveryFailureNotifier.ACTOR);
    assertThat(history.getValue().getEmailQueue()).isSameAs(alert);
    verify(emailQueueService).requestDelivery(ALERT_ID);
  }

  @Test
  void skipsTheNoticeWhenTheFailedEmailIsNotAContact() throws Exception {
    when(historyRepository.findContactByEmailQueueId(FAILED_ID)).thenReturn(Optional.empty());

    notifier.notify(brevoEmail(), "Brevo rejected the email (HTTP 401)");

    verifyNoInteractions(emailQueueService);
  }

  @Test
  void skipsTheNoticeWhenTheContactAddressIsMissing() throws Exception {
    properties.setContactToEmail(" ");

    notifier.notify(brevoEmail(), "Brevo confirmation is not configured");

    verifyNoInteractions(emailQueueService, historyRepository);
  }

  private static EmailQueue brevoEmail() throws Exception {
    EmailQueue email = new EmailQueue(
      "lea@example.test", "Merci", "enc", false, NOW, EmailChannel.BREVO
    );
    setId(email, FAILED_ID);
    return email;
  }

  private static void setId(EmailQueue email, UUID id) throws Exception {
    Field field = UuidPrimaryKeyEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(email, id);
  }
}
