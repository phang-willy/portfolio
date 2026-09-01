package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.model.UuidPrimaryKeyEntity;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.enums.UserRole;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class EmailQueueAdminServiceTest {

  private static final UUID EMAIL_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
  private static final Instant CREATED_AT = Instant.parse("2026-01-01T10:00:00Z");
  private static final Instant SCHEDULED_AT = Instant.parse("2026-01-01T10:00:00Z");
  private static final Instant SENT_AT = Instant.parse("2026-01-01T10:01:00Z");

  @Mock
  private EmailQueueRepository emailQueueRepository;

  @Mock
  private EmailQueueService emailQueueService;

  @Mock
  private CurrentUserService currentUserService;

  private EmailQueueAdminService service;

  @BeforeEach
  void setUp() {
    service = new EmailQueueAdminService(
      emailQueueRepository,
      new EmailQueueProperties(),
      emailQueueService,
      currentUserService
    );
  }

  @Test
  void getEmailsMapsMetadataWithoutReadingBody() throws Exception {
    EmailQueue email = spy(
      new EmailQueue("user@example.com", "Verify your email", "SECRET BODY", SCHEDULED_AT)
    );
    setId(email, EMAIL_ID);
    setField(email, "createdAt", CREATED_AT);
    email.markSent(SENT_AT);

    when(emailQueueRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(email)));

    PageResponse<EmailQueueAdminListItem> response = service.getEmails(0, 50);

    assertThat(response.data()).containsExactly(
      new EmailQueueAdminListItem(
        EMAIL_ID,
        "user@example.com",
        "Verify your email",
        EmailQueueStatus.SENT,
        0,
        EmailQueueProperties.DEFAULT_MAX_ATTEMPTS,
        null,
        SCHEDULED_AT,
        SENT_AT,
        CREATED_AT
      )
    );
    verify(email, never()).getBody();
  }

  @Test
  void getFailedCountReturnsRepositoryCount() {
    when(emailQueueRepository.countByStatus(EmailQueueStatus.FAILED)).thenReturn(4L);

    assertThat(service.getFailedCount().count()).isEqualTo(4L);
  }

  @Test
  void resendRequiresAdminRole() {
    when(currentUserService.requireAdmin())
      .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied"));

    assertThatThrownBy(() -> service.resend(EMAIL_ID))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.FORBIDDEN);

    verifyNoInteractions(emailQueueService);
  }

  @Test
  void resendDelegatesWhenAdmin() {
    EmailQueueAdminListItem item = new EmailQueueAdminListItem(
      EMAIL_ID,
      "user@example.com",
      "Verify your email",
      EmailQueueStatus.PENDING,
      0,
      EmailQueueProperties.DEFAULT_MAX_ATTEMPTS,
      null,
      SCHEDULED_AT,
      null,
      CREATED_AT
    );
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(emailQueueService.resend(EMAIL_ID)).thenReturn(item);

    assertThat(service.resend(EMAIL_ID)).isEqualTo(item);
    verify(emailQueueService).resend(EMAIL_ID);
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
