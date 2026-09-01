package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.dto.EmailQueueFailedCountResponse;
import com.phangwilly.portfolio.dto.EmailQueueResendRequest;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.service.EmailQueueAdminService;
import com.phangwilly.portfolio.service.EmailQueueRealtimeService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class EmailQueueAdminControllerTest {

  private static final UUID EMAIL_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final EmailQueueAdminListItem ITEM = new EmailQueueAdminListItem(
    EMAIL_ID,
    "user@example.com",
    "Verify your email",
    EmailQueueStatus.SENT,
    1,
    EmailQueueProperties.DEFAULT_MAX_ATTEMPTS,
    null,
    Instant.parse("2026-01-01T10:00:00Z"),
    Instant.parse("2026-01-01T10:01:00Z"),
    Instant.parse("2026-01-01T10:00:00Z")
  );

  @Mock
  private EmailQueueAdminService emailQueueAdminService;

  @Mock
  private EmailQueueRealtimeService emailQueueRealtimeService;

  private EmailQueueAdminController controller;

  @BeforeEach
  void setUp() {
    controller = new EmailQueueAdminController(emailQueueAdminService, emailQueueRealtimeService);
  }

  @Test
  void getEmailsDelegatesToService() {
    var page = new PageResponse<>(List.of(ITEM), new PageResponse.Pagination(0, 50, 1, 1));
    when(emailQueueAdminService.getEmails(0, 50)).thenReturn(page);

    var response = controller.getEmails(0, 50);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).containsExactly(ITEM);
    verify(emailQueueAdminService).getEmails(0, 50);
  }

  @Test
  void getFailedCountDelegatesToService() {
    var count = new EmailQueueFailedCountResponse(3);
    when(emailQueueAdminService.getFailedCount()).thenReturn(count);

    var response = controller.getFailedCount();

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(count);
    verify(emailQueueAdminService).getFailedCount();
  }

  @Test
  void resendSkipsServiceWhenHoneypotIsFilled() {
    var request = new EmailQueueResendRequest("https://spam.example");

    var response = controller.resend(EMAIL_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(emailQueueAdminService);
  }

  @Test
  void resendDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new EmailQueueResendRequest("");
    when(emailQueueAdminService.resend(EMAIL_ID)).thenReturn(ITEM);

    var response = controller.resend(EMAIL_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(ITEM);
    verify(emailQueueAdminService).resend(EMAIL_ID);
  }
}
