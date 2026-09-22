package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.UserAdminDetail;
import com.phangwilly.portfolio.dto.UserAdminUpdateRequest;
import com.phangwilly.portfolio.enums.UserHistoryType;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.model.UuidPrimaryKeyEntity;
import com.phangwilly.portfolio.repository.EmailVerificationTokenRepository;
import com.phangwilly.portfolio.repository.UserHistoryRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class UserAdminServiceTest {

  private static final UUID ACTOR_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");
  private static final UUID USER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2");
  private static final Instant NOW = Instant.parse("2026-03-01T12:00:00Z");

  @Mock
  private CurrentUserService currentUserService;

  @Mock
  private UserRepository userRepository;

  @Mock
  private UserHistoryRepository userHistoryRepository;

  @Mock
  private UserHistoryService userHistoryService;

  @Mock
  private UserSessionRepository userSessionRepository;

  @Mock
  private EmailVerificationTokenRepository emailVerificationTokenRepository;

  @Mock
  private AuthService authService;

  private UserAdminService service;

  @BeforeEach
  void setUp() {
    service = new UserAdminService(
      currentUserService,
      userRepository,
      userHistoryRepository,
      userHistoryService,
      userSessionRepository,
      emailVerificationTokenRepository,
      authService,
      Clock.fixed(NOW, ZoneOffset.UTC)
    );
  }

  @Test
  void adminCannotCheckEmailForAHigherRole() throws Exception {
    User target = user(USER_ID, "Ada", "admin@example.com");
    target.changeRole(UserRole.SUPER_ADMIN);
    when(currentUserService.requireAdmin()).thenReturn(actor(UserRole.ADMIN));
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

    assertThatThrownBy(() -> service.emailAvailable("other@example.com", USER_ID))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> assertThat(((ApiException) error).code()).isEqualTo("HIERARCHY_DENIED"));

    verify(userRepository, never()).existsByEmailIgnoreCaseAndIdNot(any(), any());
  }

  @Test
  void adminCannotUpdateAnotherAdmin() throws Exception {
    User target = user(USER_ID, "Ada", "admin@example.com");
    target.changeRole(UserRole.ADMIN);
    when(currentUserService.requireAdmin()).thenReturn(actor(UserRole.ADMIN));
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

    assertThatThrownBy(() -> service.update(USER_ID, updateRequest("USER", true, "admin@example.com", false)))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiException = (ApiException) error;
        assertThat(apiException.status()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(apiException.code()).isEqualTo("HIERARCHY_DENIED");
      });

    verify(authService, never()).queueEmailVerification(any());
  }

  @Test
  void emailChangeRequiresConfirmation() throws Exception {
    User target = user(USER_ID, "Ada", "ada@example.com");
    when(currentUserService.requireAdmin()).thenReturn(actor(UserRole.SUPER_ADMIN));
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));

    assertThatThrownBy(() -> service.update(
      USER_ID,
      updateRequest("USER", true, "ada.new@example.com", false)
    ))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> assertThat(((ApiException) error).code()).isEqualTo("EMAIL_CHANGE_UNCONFIRMED"));

    verify(authService, never()).queueEmailVerification(any());
    assertThat(target.getEmail()).isEqualTo("ada@example.com");
  }

  @Test
  void confirmedEmailChangeClearsVerificationAndSignsOut() throws Exception {
    User target = user(USER_ID, "Ada", "ada@example.com");
    target.verify(NOW.minusSeconds(60));
    when(currentUserService.requireAdmin()).thenReturn(actor(UserRole.SUPER_ADMIN));
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));
    when(userRepository.existsByEmailIgnoreCaseAndIdNot("ada.new@example.com", USER_ID)).thenReturn(false);
    when(userHistoryRepository.findByUser_IdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(USER_ID))
      .thenReturn(List.of());

    UserAdminDetail detail = service.update(
      USER_ID,
      updateRequest("ADMIN", true, "ada.new@example.com", true)
    );

    assertThat(target.getEmail()).isEqualTo("ada.new@example.com");
    assertThat(target.getVerifiedAt()).isNull();
    assertThat(target.getRole()).isEqualTo(UserRole.ADMIN);
    assertThat(detail.email()).isEqualTo("ada.new@example.com");
    assertThat(detail.manageable()).isTrue();
    verify(emailVerificationTokenRepository).consumeOpenTokens(USER_ID, NOW);
    verify(userSessionRepository).expireAllUserSessions(USER_ID, NOW);
    verify(authService).queueEmailVerification(target);
    verify(userHistoryService).record(
      eq(target),
      eq(UserHistoryType.EMAIL_CHANGED),
      any(),
      eq("ada@example.com -> ada.new@example.com")
    );
  }

  @Test
  void deactivationStoresHistoryAndExpiresSessions() throws Exception {
    User target = user(USER_ID, "Ada", "ada@example.com");
    when(currentUserService.requireAdmin()).thenReturn(actor(UserRole.ADMIN));
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(target));
    when(userHistoryRepository.findByUser_IdAndDeletedAtIsNullOrderByCreatedAtDescIdDesc(USER_ID))
      .thenReturn(List.of());

    UserAdminDetail detail = service.update(USER_ID, updateRequest("USER", false, "ada@example.com", false));

    assertThat(target.isActive()).isFalse();
    assertThat(target.getDeactivatedAt()).isEqualTo(NOW);
    assertThat(detail.deactivatedAt()).isEqualTo(NOW);
    verify(userSessionRepository).expireAllUserSessions(USER_ID, NOW);
    verify(userHistoryService).record(eq(target), eq(UserHistoryType.ACCOUNT_DEACTIVATED), any(), eq(null));
    verify(authService, never()).queueEmailVerification(any());
  }

  private static AuthenticatedUser actor(UserRole role) {
    return new AuthenticatedUser(ACTOR_ID, "actor@example.com", role, "hash");
  }

  private static User user(UUID id, String firstname, String email) throws Exception {
    User user = new User("DOE", firstname, email);
    Field field = UuidPrimaryKeyEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(user, id);
    return user;
  }

  private static UserAdminUpdateRequest updateRequest(
    String role,
    boolean active,
    String email,
    boolean confirmEmailChange
  ) {
    return new UserAdminUpdateRequest(
      "DOE",
      "Ada",
      UserRole.valueOf(role),
      active,
      email,
      confirmEmailChange,
      ""
    );
  }
}
