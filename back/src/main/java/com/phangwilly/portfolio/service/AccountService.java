package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.ChangePasswordRequest;
import com.phangwilly.portfolio.dto.EmailAvailabilityResponse;
import com.phangwilly.portfolio.dto.ProfileUpdateRequest;
import com.phangwilly.portfolio.dto.ProfileUpdateResponse;
import com.phangwilly.portfolio.dto.UserResponse;
import com.phangwilly.portfolio.enums.UserHistoryType;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.model.UserPassword;
import com.phangwilly.portfolio.repository.EmailVerificationTokenRepository;
import com.phangwilly.portfolio.repository.UserPasswordRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.util.PersonNameFormatter;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {

  private static final String PASSWORD_CHANGED_MESSAGE = "Password changed";
  private static final String PASSWORD_MISMATCH_CODE = "PASSWORD_MISMATCH";
  private static final String PASSWORD_MISMATCH_MESSAGE = "Passwords do not match";
  private static final String INVALID_OLD_PASSWORD_CODE = "INVALID_OLD_PASSWORD";
  private static final String INVALID_OLD_PASSWORD_MESSAGE = "Old password is invalid";
  private static final String USER_NOT_FOUND_CODE = "USER_NOT_FOUND";
  private static final String USER_NOT_FOUND_MESSAGE = "User not found";
  private static final String EMAIL_CODE = "EMAIL_ALREADY_EXISTS";
  private static final String EMAIL_MESSAGE = "Email already exists";
  private static final String EMAIL_CONFIRM_CODE = "EMAIL_CHANGE_UNCONFIRMED";
  private static final String EMAIL_CONFIRM_MESSAGE = "Confirm the email change before saving";
  private static final String INVALID_EMAIL_CODE = "INVALID_EMAIL";
  private static final String INVALID_EMAIL_MESSAGE = "Enter a valid email";
  private static final String PROFILE_PASSWORD_DETAIL = "Profile";

  private final CurrentUserService currentUserService;
  private final UserRepository userRepository;
  private final UserPasswordRepository userPasswordRepository;
  private final UserSessionRepository userSessionRepository;
  private final EmailVerificationTokenRepository emailVerificationTokenRepository;
  private final UserHistoryService userHistoryService;
  private final AuthService authService;
  private final PasswordEncoder passwordEncoder;
  private final Clock clock;

  public AccountService(
    CurrentUserService currentUserService,
    UserRepository userRepository,
    UserPasswordRepository userPasswordRepository,
    UserSessionRepository userSessionRepository,
    EmailVerificationTokenRepository emailVerificationTokenRepository,
    UserHistoryService userHistoryService,
    AuthService authService,
    PasswordEncoder passwordEncoder,
    Clock clock
  ) {
    this.currentUserService = currentUserService;
    this.userRepository = userRepository;
    this.userPasswordRepository = userPasswordRepository;
    this.userSessionRepository = userSessionRepository;
    this.emailVerificationTokenRepository = emailVerificationTokenRepository;
    this.userHistoryService = userHistoryService;
    this.authService = authService;
    this.passwordEncoder = passwordEncoder;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public EmailAvailabilityResponse emailAvailable(String email) {
    AuthenticatedUser currentUser = currentUserService.getCurrentUser();
    String normalized = normalizeEmail(email);
    if (!isPlausibleEmail(normalized)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_EMAIL_CODE, INVALID_EMAIL_MESSAGE);
    }

    boolean available = !userRepository.existsByEmailIgnoreCaseAndIdNot(normalized, currentUser.id());
    return new EmailAvailabilityResponse(available);
  }

  @Transactional
  public ProfileUpdateResponse updateProfile(ProfileUpdateRequest request) {
    AuthenticatedUser currentUser = currentUserService.getCurrentUser();
    User user = findUser(currentUser);
    String lastname = PersonNameFormatter.formatLastname(request.lastname());
    String firstname = PersonNameFormatter.formatFirstname(request.firstname());
    String email = normalizeEmail(request.email());
    boolean emailChanged = !email.equalsIgnoreCase(user.getEmail());

    if (emailChanged && !request.confirmEmailChange()) {
      throw new ApiException(HttpStatus.CONFLICT, EMAIL_CONFIRM_CODE, EMAIL_CONFIRM_MESSAGE);
    }

    if (emailChanged && userRepository.existsByEmailIgnoreCaseAndIdNot(email, user.getId())) {
      throw new ApiException(HttpStatus.CONFLICT, EMAIL_CODE, EMAIL_MESSAGE);
    }

    boolean nameChanged = !lastname.equals(user.getLastname()) || !firstname.equals(user.getFirstname());
    String previousName = UserHistoryService.displayName(user);
    String previousEmail = user.getEmail();
    Instant now = Instant.now(clock);

    if (nameChanged) {
      user.rename(lastname, firstname);
      userHistoryService.recordSelf(
        user,
        UserHistoryType.PROFILE_UPDATED,
        previousName + " -> " + UserHistoryService.displayName(user)
      );
    }

    if (emailChanged) {
      user.changeEmail(email);
      emailVerificationTokenRepository.consumeOpenTokens(user.getId(), now);
      userSessionRepository.expireAllUserSessions(user.getId(), now);
      authService.queueEmailVerification(user);
      userHistoryService.recordSelf(
        user,
        UserHistoryType.EMAIL_CHANGED,
        previousEmail + " -> " + email
      );
    }

    return new ProfileUpdateResponse(UserResponse.from(user), emailChanged);
  }

  @Transactional
  public AuthMessageResponse changePassword(ChangePasswordRequest request) {
    if (!request.newPassword().equals(request.confirmPassword())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        PASSWORD_MISMATCH_CODE,
        PASSWORD_MISMATCH_MESSAGE
      );
    }

    AuthenticatedUser currentUser = currentUserService.getCurrentUser();
    User user = userRepository
      .findById(currentUser.id())
      .orElseThrow(() -> new ApiException(
        HttpStatus.UNAUTHORIZED,
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_MESSAGE
      ));
    UserPassword password = userPasswordRepository
      .findByUser(user)
      .orElseThrow(() -> new ApiException(
        HttpStatus.UNAUTHORIZED,
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_MESSAGE
      ));

    if (!passwordEncoder.matches(request.oldPassword(), password.getPasswordHash())) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        INVALID_OLD_PASSWORD_CODE,
        INVALID_OLD_PASSWORD_MESSAGE
      );
    }

    password.updatePasswordHash(passwordEncoder.encode(request.newPassword()));
    userSessionRepository.expireOtherSessions(
      currentUser.id(),
      currentUser.tokenHash(),
      Instant.now(clock)
    );
    userHistoryService.recordSelf(user, UserHistoryType.PASSWORD_CHANGED, PROFILE_PASSWORD_DETAIL);

    return new AuthMessageResponse(PASSWORD_CHANGED_MESSAGE);
  }

  private User findUser(AuthenticatedUser currentUser) {
    return userRepository
      .findById(currentUser.id())
      .orElseThrow(() -> new ApiException(
        HttpStatus.UNAUTHORIZED,
        USER_NOT_FOUND_CODE,
        USER_NOT_FOUND_MESSAGE
      ));
  }

  private static String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private static boolean isPlausibleEmail(String email) {
    int at = email.indexOf('@');
    return at > 0 && at < email.length() - 1 && !email.contains(" ") && email.length() <= 320;
  }
}
