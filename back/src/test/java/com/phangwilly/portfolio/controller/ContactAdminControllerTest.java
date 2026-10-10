package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ContactAdminDetail;
import com.phangwilly.portfolio.dto.ContactAdminListItem;
import com.phangwilly.portfolio.dto.ContactPresenceRequest;
import com.phangwilly.portfolio.dto.ContactPresenceState;
import com.phangwilly.portfolio.dto.ContactReadRequest;
import com.phangwilly.portfolio.dto.ContactReplyRequest;
import com.phangwilly.portfolio.dto.ContactUnreadCountResponse;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.service.ContactAdminService;
import com.phangwilly.portfolio.service.ContactPresenceService;
import com.phangwilly.portfolio.service.ContactRealtimeService;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@ExtendWith(MockitoExtension.class)
class ContactAdminControllerTest {

  private static final UUID CONTACT_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  private static final Instant NOW = Instant.parse("2026-09-21T12:00:00Z");
  private static final ContactAdminListItem ITEM = new ContactAdminListItem(
    CONTACT_ID, "Léa", "Martin", "lea@example.test", "Projet",
    ContactStatus.RECEIVED, NOW, NOW, null
  );
  private static final ContactAdminDetail DETAIL = new ContactAdminDetail(
    CONTACT_ID, "Léa", "Martin", "lea@example.test", "Projet", ContactStatus.READ,
    NOW, NOW, NOW, NOW, null, null, "Bonjour", List.of()
  );

  @Mock private ContactAdminService contactAdminService;
  @Mock private ContactPresenceService contactPresenceService;
  @Mock private ContactRealtimeService contactRealtimeService;

  private ContactAdminController controller;

  @BeforeEach
  void setUp() {
    controller = new ContactAdminController(contactAdminService, contactPresenceService, contactRealtimeService);
  }

  @Test
  void getContactsDelegatesToService() {
    var page = new PageResponse<>(List.of(ITEM), new PageResponse.Pagination(0, 10, 1, 1));
    when(contactAdminService.getContacts(0, 10, "Léa", ContactStatus.RECEIVED)).thenReturn(page);

    var response = controller.getContacts(0, 10, "Léa", ContactStatus.RECEIVED);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).containsExactly(ITEM);
    verify(contactAdminService).getContacts(0, 10, "Léa", ContactStatus.RECEIVED);
  }

  @Test
  void getUnreadCountDelegatesToService() {
    when(contactAdminService.getUnreadCount()).thenReturn(new ContactUnreadCountResponse(4));

    var response = controller.getUnreadCount();

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data().count()).isEqualTo(4);
  }

  @Test
  void streamSetsSseHeadersAndSubscribes() {
    var response = mock(HttpServletResponse.class);
    var emitter = new SseEmitter();
    when(contactRealtimeService.subscribe()).thenReturn(emitter);

    assertThat(controller.stream(response)).isSameAs(emitter);
    verify(response).setHeader("Cache-Control", "no-cache");
    verify(response).setHeader("X-Accel-Buffering", "no");
    verify(contactRealtimeService).subscribe();
  }

  @Test
  void markReadSkipsServiceWhenHoneypotIsFilled() {
    var response = controller.markRead(CONTACT_ID, new ContactReadRequest("https://spam.example"));

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(contactAdminService);
  }

  @Test
  void markReadDelegatesWhenHoneypotIsEmpty() {
    when(contactAdminService.markRead(CONTACT_ID)).thenReturn(DETAIL);

    var response = controller.markRead(CONTACT_ID, new ContactReadRequest(""));

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(DETAIL);
    verify(contactAdminService).markRead(CONTACT_ID);
  }

  @Test
  void replySkipsServiceWhenHoneypotIsFilled() {
    var response = controller.reply(CONTACT_ID, new ContactReplyRequest("Bonjour", "bot"));

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(contactAdminService);
  }

  @Test
  void replyDelegatesWhenHoneypotIsEmpty() {
    when(contactAdminService.reply(CONTACT_ID, "Merci")).thenReturn(DETAIL);

    var response = controller.reply(CONTACT_ID, new ContactReplyRequest("Merci", ""));

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(DETAIL);
    verify(contactAdminService).reply(CONTACT_ID, "Merci");
  }

  @Test
  void heartbeatSkipsServiceWhenHoneypotIsFilled() {
    var response = controller.heartbeat(CONTACT_ID, new ContactPresenceRequest(CONTACT_ID, "https://spam.example"));

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(contactPresenceService);
  }

  @Test
  void heartbeatDelegatesWhenHoneypotIsEmpty() {
    UUID sessionId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    var state = new ContactPresenceState(CONTACT_ID, false, null, List.of());
    when(contactPresenceService.heartbeat(CONTACT_ID, sessionId)).thenReturn(state);

    var response = controller.heartbeat(CONTACT_ID, new ContactPresenceRequest(sessionId, ""));

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(state);
    verify(contactPresenceService).heartbeat(CONTACT_ID, sessionId);
  }

  @Test
  void leaveDelegatesToPresenceService() {
    UUID sessionId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    var state = new ContactPresenceState(CONTACT_ID, false, null, List.of());
    when(contactPresenceService.leave(CONTACT_ID, sessionId)).thenReturn(state);

    var response = controller.leave(CONTACT_ID, sessionId);

    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(state);
    verify(contactPresenceService).leave(CONTACT_ID, sessionId);
  }
}
