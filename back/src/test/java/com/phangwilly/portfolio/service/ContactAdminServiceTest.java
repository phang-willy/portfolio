package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ContactReplyRequest;
import com.phangwilly.portfolio.enums.ContactHistoryType;
import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.event.ContactChangedEvent;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.ContactHistory;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.repository.ContactHistoryRepository;
import com.phangwilly.portfolio.repository.ContactRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
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
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ContactAdminServiceTest {

  private static final UUID CONTACT_ID = UUID.randomUUID();
  private static final UUID ACTOR_ID = UUID.randomUUID();
  private static final UUID EMAIL_ID = UUID.randomUUID();
  private static final Instant RECEIVED_AT = Instant.parse("2026-09-01T10:00:00Z");
  private static final Instant NOW = Instant.parse("2026-09-21T12:00:00Z");
  private static final AuthenticatedUser ACTOR = new AuthenticatedUser(ACTOR_ID, "admin@example.com", UserRole.ADMIN, "hash");

  @Mock private ContactRepository contacts;
  @Mock private ContactHistoryRepository histories;
  @Mock private UserRepository users;
  @Mock private CurrentUserService currentUser;
  @Mock private ContactReplyEmailFactory emailFactory;
  @Mock private EmailQueueService emailQueue;
  @Mock private ContactPresenceService presence;
  @Mock private ApplicationEventPublisher events;

  private ContactAdminService service;
  private Contact contact;

  @BeforeEach
  void setUp() {
    service = new ContactAdminService(contacts, histories, users, currentUser, emailFactory, emailQueue, presence, events,
      Clock.fixed(NOW, ZoneOffset.UTC));
    contact = new Contact("Alice", "Martin", "alice@example.com", null, null, "Projet", "Ma demande initiale");
    ReflectionTestUtils.setField(contact, "id", CONTACT_ID);
    ReflectionTestUtils.setField(contact, "createdAt", RECEIVED_AT);
    ReflectionTestUtils.setField(contact, "updatedAt", RECEIVED_AT);
    when(currentUser.requireAdmin()).thenReturn(ACTOR);
    lenient().when(presence.isReadOnly(any(), any())).thenReturn(false);
  }

  @Test
  void detailIncludesReceiptForImportedContactWithoutMarkingItRead() {
    when(contacts.findByIdAndDeletedAtIsNull(CONTACT_ID)).thenReturn(Optional.of(contact));

    var detail = service.getContact(CONTACT_ID);

    assertThat(detail.status()).isEqualTo(ContactStatus.RECEIVED);
    assertThat(detail.firstReadAt()).isNull();
    assertThat(detail.history()).singleElement().satisfies(receipt -> {
      assertThat(receipt.type()).isEqualTo(ContactHistoryType.RECEIVED);
      assertThat(receipt.createdAt()).isEqualTo(RECEIVED_AT);
      assertThat(receipt.message()).isEqualTo("Ma demande initiale");
    });
    verify(contacts, never()).findActiveForUpdate(any());
    verify(histories, never()).save(any());
    verify(histories, never()).saveAndFlush(any());
    verifyNoInteractions(emailQueue, events);
  }

  @Test
  void firstReadLocksContactAndRecordsActorWithTimestamp() {
    when(contacts.findActiveForUpdate(CONTACT_ID)).thenReturn(Optional.of(contact));
    when(users.findById(ACTOR_ID)).thenReturn(Optional.of(new User("Dupont", "Willy", ACTOR.email())));

    service.markRead(CONTACT_ID);

    assertThat(contact.getStatus()).isEqualTo(ContactStatus.READ);
    assertThat(contact.getFirstReadAt()).isEqualTo(NOW);
    assertThat(contact.getLastReadAt()).isEqualTo(NOW);
    var history = ArgumentCaptor.forClass(ContactHistory.class);
    verify(histories).saveAndFlush(history.capture());
    assertThat(history.getValue().getType()).isEqualTo(ContactHistoryType.READ);
    assertThat(history.getValue().getActorId()).isEqualTo(ACTOR_ID);
    assertThat(history.getValue().getActorName()).isEqualTo("Willy Dupont");
    verify(events).publishEvent(any(ContactChangedEvent.class));
  }

  @Test
  void laterReadRecordsVisitWithoutLosingOriginalReadDateOrReplyStatus() {
    contact.markReplied(RECEIVED_AT.plusSeconds(60));
    when(contacts.findActiveForUpdate(CONTACT_ID)).thenReturn(Optional.of(contact));

    service.markRead(CONTACT_ID);

    assertThat(contact.getStatus()).isEqualTo(ContactStatus.REPLIED);
    assertThat(contact.getFirstReadAt()).isEqualTo(RECEIVED_AT.plusSeconds(60));
    assertThat(contact.getLastReadAt()).isEqualTo(NOW);
    var history = ArgumentCaptor.forClass(ContactHistory.class);
    verify(histories).saveAndFlush(history.capture());
    assertThat(history.getValue().getActorName()).isEqualTo(ACTOR.email());
    assertThat(history.getValue().getType()).isEqualTo(ContactHistoryType.READ);
  }

  @Test
  void replyArchivesContentAndQueuesDeliveryAfterPersistingHistory() {
    contact.markRead(RECEIVED_AT.plusSeconds(60));
    when(contacts.findActiveForUpdate(CONTACT_ID)).thenReturn(Optional.of(contact));
    EmailMessage message = new EmailMessage(contact.getEmail(), "Portfolio - SUITE : Projet", "<p>Ma réponse</p>", true);
    EmailQueue queued = queuedEmail(message.subject());
    when(emailFactory.create(contact, "Ma réponse")).thenReturn(message);
    when(emailQueue.enqueue(message)).thenReturn(queued);

    service.reply(CONTACT_ID, "  Ma réponse  ");

    var history = ArgumentCaptor.forClass(ContactHistory.class);
    var order = inOrder(emailQueue, histories, contacts);
    order.verify(contacts).findActiveForUpdate(CONTACT_ID);
    order.verify(emailQueue).enqueue(message);
    order.verify(histories).saveAndFlush(history.capture());
    order.verify(contacts).saveAndFlush(contact);
    order.verify(emailQueue).requestDelivery(EMAIL_ID);
    assertThat(history.getValue().getMessage()).isEqualTo("Ma réponse");
    assertThat(history.getValue().getSubject()).isEqualTo(message.subject());
    assertThat(history.getValue().getEmailQueue()).isSameAs(queued);
    assertThat(history.getValue().getType()).isEqualTo(ContactHistoryType.REPLIED);
    assertThat(contact.getStatus()).isEqualTo(ContactStatus.REPLIED);
    assertThat(queued.getStatus()).isEqualTo(EmailQueueStatus.PENDING);
  }

  @Test
  void directReplyToUnreadContactAlsoArchivesFirstConsultation() {
    when(contacts.findActiveForUpdate(CONTACT_ID)).thenReturn(Optional.of(contact));
    when(emailQueue.enqueue(any(EmailMessage.class))).thenReturn(queuedEmail("Réponse"));
    when(emailFactory.create(contact, "Bonjour")).thenReturn(new EmailMessage(contact.getEmail(), "Réponse", "Bonjour"));

    service.reply(CONTACT_ID, "Bonjour");

    var read = ArgumentCaptor.forClass(ContactHistory.class);
    verify(histories).save(read.capture());
    assertThat(read.getValue().getType()).isEqualTo(ContactHistoryType.READ);
    assertThat(contact.getFirstReadAt()).isEqualTo(NOW);
  }

  @Test
  void failedQueueWriteDoesNotMarkContactRepliedOrRecordHistory() {
    when(contacts.findActiveForUpdate(CONTACT_ID)).thenReturn(Optional.of(contact));
    when(emailFactory.create(contact, "Bonjour")).thenReturn(new EmailMessage(contact.getEmail(), "Réponse", "Bonjour"));
    when(emailQueue.enqueue(any(EmailMessage.class))).thenThrow(new IllegalStateException("storage unavailable"));

    assertThatThrownBy(() -> service.reply(CONTACT_ID, "Bonjour")).isInstanceOf(IllegalStateException.class);

    assertThat(contact.getStatus()).isEqualTo(ContactStatus.RECEIVED);
    verifyNoInteractions(histories, events);
    verify(emailQueue, never()).requestDelivery(any());
  }

  @Test
  void detailUsesCurrentDeliveryStateWithoutExposingEncryptedEmailBody() {
    EmailQueue email = queuedEmail("Portfolio - SUITE : Projet");
    email.markSent(NOW);
    var reply = ContactHistory.replied(contact, ACTOR_ID, "Willy", "Réponse enregistrée", email);
    when(contacts.findByIdAndDeletedAtIsNull(CONTACT_ID)).thenReturn(Optional.of(contact));
    when(histories.findByContactIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(CONTACT_ID)).thenReturn(List.of(reply));

    var detail = service.getContact(CONTACT_ID);

    assertThat(detail.history().get(1).emailStatus()).isEqualTo(EmailQueueStatus.SENT);
    assertThat(detail.history().get(1).sentAt()).isEqualTo(NOW);
    assertThat(detail.history().get(1).message()).isEqualTo("Réponse enregistrée");
  }

  @Test
  void unauthorizedReadOrReplyCannotAccessContactData() {
    when(currentUser.requireAdmin()).thenThrow(new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied"));

    assertThatThrownBy(() -> service.getContact(CONTACT_ID)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.markRead(CONTACT_ID)).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.reply(CONTACT_ID, "Bonjour")).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.getUnreadCount()).isInstanceOf(ApiException.class);

    verifyNoInteractions(contacts, histories, emailQueue);
  }

  @Test
  void invalidReplyIsRejectedBeforeQueryingOrQueueing() {
    assertThatThrownBy(() -> service.reply(CONTACT_ID, " \n "))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThatThrownBy(() -> service.reply(CONTACT_ID, "a".repeat(ContactReplyRequest.MESSAGE_MAX_LENGTH + 1)))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status()).isEqualTo(HttpStatus.BAD_REQUEST);
    verifyNoInteractions(contacts, histories, emailQueue);
  }

  @Test
  void replyAtCharacterLimitIsAccepted() {
    String message = "a".repeat(ContactReplyRequest.MESSAGE_MAX_LENGTH);
    when(contacts.findActiveForUpdate(CONTACT_ID)).thenReturn(Optional.of(contact));
    when(emailFactory.create(contact, message))
      .thenReturn(new EmailMessage(contact.getEmail(), "Réponse", message, true));
    when(emailQueue.enqueue(any(EmailMessage.class))).thenReturn(queuedEmail("Réponse"));

    service.reply(CONTACT_ID, message);

    verify(emailFactory).create(contact, message);
    verify(emailQueue).requestDelivery(EMAIL_ID);
  }

  @Test
  void occupiedPageRejectsReplyWithoutQueueing() {
    when(presence.isReadOnly(CONTACT_ID, ACTOR_ID)).thenReturn(true);

    assertThatThrownBy(() -> service.reply(CONTACT_ID, "Bonjour"))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status()).isEqualTo(HttpStatus.CONFLICT);
    verifyNoInteractions(emailQueue, histories);
  }

  @Test
  void missingContactReturnsNotFoundWithoutQueueing() {
    assertThatThrownBy(() -> service.reply(CONTACT_ID, "Bonjour"))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status()).isEqualTo(HttpStatus.NOT_FOUND);
    verifyNoInteractions(histories, emailQueue);
  }

  private static EmailQueue queuedEmail(String subject) {
    var email = new EmailQueue("alice@example.com", subject, "encrypted body", NOW);
    ReflectionTestUtils.setField(email, "id", EMAIL_ID);
    return email;
  }
}
