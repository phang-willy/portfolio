package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ChangePasswordRequest;
import com.phangwilly.portfolio.dto.ProfileUpdateRequest;
import com.phangwilly.portfolio.dto.ProfileUpdateResponse;
import com.phangwilly.portfolio.enums.UserHistoryType;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.model.UserPassword;
import com.phangwilly.portfolio.model.UuidPrimaryKeyEntity;
import com.phangwilly.portfolio.repository.EmailVerificationTokenRepository;
import com.phangwilly.portfolio.repository.UserPasswordRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.lang.reflect.Field;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

  private static final UUID USER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2");
  private static final Instant NOW = Instant.parse("2026-03-01T12:00:00Z");

  @Mock
  private CurrentUserService currentUserService;

  @Mock
  private UserRepository userRepository;

  @Mock
  private UserPasswordRepository userPasswordRepository;

  @Mock
  private UserSessionRepository userSessionRepository;

  @Mock
  private EmailVerificationTokenRepository emailVerificationTokenRepository;

  @Mock
  private UserHistoryService userHistoryService;

  @Mock
  private AuthService authService;

  @Mock
  private PasswordEncoder passwordEncoder;

  private AccountService service;

  @BeforeEach
  void setUp() {
    service = new AccountService(
      currentUserService,
      userRepository,
      userPasswordRepository,
      userSessionRepository,
      emailVerificationTokenRepository,
      userHistoryService,
      authService,
      passwordEncoder,
      Clock.fixed(NOW, ZoneOffset.UTC)
    );
  }

  @Test
  void emailChangeRequiresConfirmation() throws Exception {
    User user = user("Ada", "ada@example.com");
    when(currentUserService.getCurrentUser()).thenReturn(actor());
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

    assertThatThrownBy(() -> service.updateProfile(profileRequest("ada.new@example.com", false)))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> assertThat(((ApiException) error).code()).isEqualTo("EMAIL_CHANGE_UNCONFIRMED"));

    assertThat(user.getEmail()).isEqualTo("ada@example.com");
    verify(authService, never()).queueEmailVerification(any());
  }

  @Test
  void confirmedEmailChangeSignsOutAndSendsVerification() throws Exception {
    User user = user("Ada", "ada@example.com");
    user.verify(NOW.minusSeconds(60));
    when(currentUserService.getCurrentUser()).thenReturn(actor());
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    when(userRepository.existsByEmailIgnoreCaseAndIdNot("ada.new@example.com", USER_ID)).thenReturn(false);

    ProfileUpdateResponse updated = service.updateProfile(profileRequest("ada.new@example.com", true));

    assertThat(updated.signedOut()).isTrue();
    assertThat(updated.user().email()).isEqualTo("ada.new@example.com");
    assertThat(user.getVerifiedAt()).isNull();
    verify(emailVerificationTokenRepository).consumeOpenTokens(USER_ID, NOW);
    verify(userSessionRepository).expireAllUserSessions(USER_ID, NOW);
    verify(authService).queueEmailVerification(user);
    verify(userHistoryService).recordSelf(
      user,
      UserHistoryType.EMAIL_CHANGED,
      "ada@example.com -> ada.new@example.com"
    );
  }

  @Test
  void nameChangeKeepsTheSession() throws Exception {
    User user = user("Ada", "ada@example.com");
    when(currentUserService.getCurrentUser()).thenReturn(actor());
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

    ProfileUpdateResponse updated = service.updateProfile(
      new ProfileUpdateRequest("DOE", "Grace", "ada@example.com", false, "")
    );

    assertThat(updated.signedOut()).isFalse();
    assertThat(user.getFirstname()).isEqualTo("Grace");
    assertThat(user.getLastname()).isEqualTo("DOE");
    verify(userHistoryService).recordSelf(user, UserHistoryType.PROFILE_UPDATED, "Ada DOE -> Grace DOE");
    verify(userSessionRepository, never()).expireAllUserSessions(any(), any());
    verify(authService, never()).queueEmailVerification(any());
  }

  @Test
  void changePasswordRecordsHistory() throws Exception {
    User user = user("Ada", "ada@example.com");
    UserPassword password = new UserPassword(user, "hash");
    ChangePasswordRequest request = new ChangePasswordRequest("old-password", "new-password", "new-password", "");
    when(currentUserService.getCurrentUser()).thenReturn(actor());
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    when(userPasswordRepository.findByUser(user)).thenReturn(Optional.of(password));
    when(passwordEncoder.matches("old-password", "hash")).thenReturn(true);
    when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

    service.changePassword(request);

    verify(userSessionRepository).expireOtherSessions(USER_ID, "hash", NOW);
    verify(userHistoryService).recordSelf(user, UserHistoryType.PASSWORD_CHANGED, "Profile");
  }

  @Test
  void takenEmailIsRejected() throws Exception {
    User user = user("Ada", "ada@example.com");
    when(currentUserService.getCurrentUser()).thenReturn(actor());
    when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    when(userRepository.existsByEmailIgnoreCaseAndIdNot("ada.new@example.com", USER_ID)).thenReturn(true);

    assertThatThrownBy(() -> service.updateProfile(profileRequest("ada.new@example.com", true)))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiException = (ApiException) error;
        assertThat(apiException.status()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(apiException.code()).isEqualTo("EMAIL_ALREADY_EXISTS");
      });
  }

  private static AuthenticatedUser actor() {
    return new AuthenticatedUser(USER_ID, "ada@example.com", UserRole.ADMIN, "hash");
  }

  private static User user(String firstname, String email) throws Exception {
    User user = new User("DOE", firstname, email);
    Field field = UuidPrimaryKeyEntity.class.getDeclaredField("id");
    field.setAccessible(true);
    field.set(user, USER_ID);
    return user;
  }

  private static ProfileUpdateRequest profileRequest(String email, boolean confirmEmailChange) {
    return new ProfileUpdateRequest("DOE", "Ada", email, confirmEmailChange, "");
  }
}
