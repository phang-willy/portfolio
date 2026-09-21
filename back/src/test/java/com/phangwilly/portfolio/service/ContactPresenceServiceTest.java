package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ContactPresenceEvent;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.repository.ContactRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
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
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ContactPresenceServiceTest {

  private static final UUID CONTACT_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  private static final UUID SESSION_A = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final UUID SESSION_B = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final Instant NOW = Instant.parse("2026-09-21T21:00:00Z");
  private static final AuthenticatedUser ACTOR_A =
    new AuthenticatedUser(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"), "willy@example.test", UserRole.ADMIN, "h");
  private static final AuthenticatedUser ACTOR_B =
    new AuthenticatedUser(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"), "lea@example.test", UserRole.ADMIN, "h");

  @Mock private ContactRepository contacts;
  @Mock private UserRepository users;
  @Mock private CurrentUserService currentUser;
  @Mock private ContactRealtimeService realtime;

  private ContactPresenceService service;

  @BeforeEach
  void setUp() {
    service = new ContactPresenceService(
      contacts, users, currentUser, realtime, Clock.fixed(NOW, ZoneOffset.UTC)
    );
    Contact contact = new Contact("Léa", "Martin", "lea@example.test", null, null, "Projet", "Message");
    ReflectionTestUtils.setField(contact, "id", CONTACT_ID);
    when(contacts.findByIdAndDeletedAtIsNull(CONTACT_ID)).thenReturn(Optional.of(contact));
  }

  @Test
  void firstViewerCanEditAndLaterViewerIsReadOnly() {
    when(currentUser.requireAdmin()).thenReturn(ACTOR_A, ACTOR_B);
    when(users.findById(ACTOR_A.id())).thenReturn(Optional.of(new User("Admin", "Willy", ACTOR_A.email())));
    when(users.findById(ACTOR_B.id())).thenReturn(Optional.of(new User("Martin", "Léa", ACTOR_B.email())));

    var first = service.heartbeat(CONTACT_ID, SESSION_A);
    var second = service.heartbeat(CONTACT_ID, SESSION_B);

    assertThat(first.readOnly()).isFalse();
    assertThat(first.occupant()).isNull();
    assertThat(second.readOnly()).isTrue();
    assertThat(second.occupant().name()).isEqualTo("Willy Admin");
    assertThat(second.occupant().joinedAt()).isEqualTo(NOW);
    ArgumentCaptor<ContactPresenceEvent> event = ArgumentCaptor.forClass(ContactPresenceEvent.class);
    verify(realtime, atLeastOnce()).broadcastPresence(event.capture());
    assertThat(event.getValue().contactId()).isEqualTo(CONTACT_ID);
  }

  @Test
  void sameUserKeepsTheLockAcrossSessions() {
    when(currentUser.requireAdmin()).thenReturn(ACTOR_A);
    when(users.findById(ACTOR_A.id())).thenReturn(Optional.of(new User("Admin", "Willy", ACTOR_A.email())));

    var first = service.heartbeat(CONTACT_ID, SESSION_A);
    var second = service.heartbeat(CONTACT_ID, SESSION_B);

    assertThat(first.readOnly()).isFalse();
    assertThat(second.readOnly()).isFalse();
    assertThat(second.viewers()).hasSize(1);
    assertThat(second.occupant()).isNull();
  }

  @Test
  void leavingTransfersTheLockToTheRemainingViewer() {
    when(users.findById(ACTOR_A.id())).thenReturn(Optional.of(new User("Admin", "Willy", ACTOR_A.email())));
    when(users.findById(ACTOR_B.id())).thenReturn(Optional.of(new User("Martin", "Léa", ACTOR_B.email())));

    when(currentUser.requireAdmin()).thenReturn(ACTOR_A);
    service.heartbeat(CONTACT_ID, SESSION_A);
    when(currentUser.requireAdmin()).thenReturn(ACTOR_B);
    service.heartbeat(CONTACT_ID, SESSION_B);
    when(currentUser.requireAdmin()).thenReturn(ACTOR_A);
    service.leave(CONTACT_ID, SESSION_A);
    when(currentUser.requireAdmin()).thenReturn(ACTOR_B);

    var remaining = service.heartbeat(CONTACT_ID, SESSION_B);

    assertThat(remaining.readOnly()).isFalse();
    assertThat(remaining.occupant()).isNull();
  }
}
