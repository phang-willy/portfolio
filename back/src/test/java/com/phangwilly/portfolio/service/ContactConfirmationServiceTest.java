package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class ContactConfirmationServiceTest {

  private static final UUID EMAIL_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  @Mock
  private EmailQueueService emailQueueService;
  @Mock
  private ContactHistoryRepository historyRepository;

  @Test
  void queuesTheSavedContactOnTheOriginalBrevoTemplate() throws Exception {
    BrevoProperties properties = new BrevoProperties();
    properties.setContactTemplateId("42");
    JsonMapper json = JsonMapper.builder().build();
    ContactConfirmationService service = new ContactConfirmationService(
      emailQueueService, historyRepository, properties, json
    );
    Contact contact = new Contact(
      "Léa", "Martin", "lea@example.test", "0600000000", "Atelier", "Projet", "Bonjour"
    );
    EmailQueue email = new EmailQueue(
      "lea@example.test", "Merci", "enc", false, Instant.parse("2026-01-01T10:00:00Z"), EmailChannel.BREVO
    );
    setId(email, EMAIL_ID);
    when(emailQueueService.enqueue(any(EmailMessage.class), eq(EmailChannel.BREVO))).thenReturn(email);

    service.queue(contact, Map.of("OBJECT", "Merci", "BODY_LINE1", "Bonjour, Bonsoir", "FIRSTNAME", "spoof"));

    ArgumentCaptor<EmailMessage> message = ArgumentCaptor.forClass(EmailMessage.class);
    verify(emailQueueService).enqueue(message.capture(), eq(EmailChannel.BREVO));
    assertThat(message.getValue().recipient()).isEqualTo("lea@example.test");
    assertThat(message.getValue().subject()).isEqualTo("Merci");
    assertThat(message.getValue().html()).isFalse();
    BrevoTemplatePayload payload = json.readValue(message.getValue().body(), BrevoTemplatePayload.class);
    assertThat(payload.templateId()).isEqualTo(42);
    assertThat(payload.recipientName()).isEqualTo("Léa");
    assertThat(payload.params())
      .containsEntry("FIRSTNAME", "Léa")
      .containsEntry("LASTNAME", "Martin")
      .containsEntry("EMAIL", "lea@example.test")
      .containsEntry("TITLE", "Projet")
      .containsEntry("MESSAGE", "Bonjour")
      .containsEntry("BODY_LINE1", "Bonjour, Bonsoir");

    ArgumentCaptor<ContactHistory> history = ArgumentCaptor.forClass(ContactHistory.class);
    verify(historyRepository).save(history.capture());
    assertThat(history.getValue().getType()).isEqualTo(ContactHistoryType.CONFIRMATION);
    assertThat(history.getValue().getEmailQueue()).isSameAs(email);
    assertThat(history.getValue().getActorName()).isEqualTo(ContactConfirmationService.ACTOR);
    verify(emailQueueService).requestDelivery(EMAIL_ID);
  }

  private static void setId(EmailQueue email, UUID id) throws Exception {
    Field field = UuidPrimaryKeyEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(email, id);
  }
}
