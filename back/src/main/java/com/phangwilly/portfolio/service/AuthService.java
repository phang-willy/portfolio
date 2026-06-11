package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.AuthDurations;
import com.phangwilly.portfolio.config.AuthProperties;
import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.AuthPublicConfigResponse;
import com.phangwilly.portfolio.dto.AuthenticatedUserResponse;
import com.phangwilly.portfolio.dto.ForgotPasswordRequest;
import com.phangwilly.portfolio.dto.LoginRequest;
import com.phangwilly.portfolio.dto.LoginResponse;
import com.phangwilly.portfolio.dto.RegisterRequest;
import com.phangwilly.portfolio.dto.ResetPasswordRequest;
import com.phangwilly.portfolio.dto.UserResponse;
import com.phangwilly.portfolio.dto.VerifyTwoFactorRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.EmailVerificationToken;
import com.phangwilly.portfolio.model.ForgotPassword;
import com.phangwilly.portfolio.model.TwoFactorAuth;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.model.UserPassword;
import com.phangwilly.portfolio.model.UserSession;
import com.phangwilly.portfolio.repository.EmailVerificationTokenRepository;
import com.phangwilly.portfolio.repository.ForgotPasswordRepository;
import com.phangwilly.portfolio.repository.TwoFactorAuthRepository;
import com.phangwilly.portfolio.repository.UserPasswordRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.security.JwtPayload;
import com.phangwilly.portfolio.security.JwtService;
import com.phangwilly.portfolio.security.SecureTokenService;
import com.phangwilly.portfolio.security.TokenHashService;
import com.phangwilly.portfolio.security.TwoFactorCodeService;
import com.phangwilly.portfolio.util.PersonNameFormatter;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private static final String REGISTER_DISABLED_CODE = "REGISTER_DISABLED";
  private static final String REGISTER_DISABLED_MESSAGE = "Registration is disabled";
  private static final String EMAIL_ALREADY_EXISTS_CODE = "EMAIL_ALREADY_EXISTS";
  private static final String EMAIL_ALREADY_EXISTS_MESSAGE = "Email already exists";
  private static final String PASSWORD_MISMATCH_CODE = "PASSWORD_MISMATCH";
  private static final String PASSWORD_MISMATCH_MESSAGE = "Passwords do not match";
  private static final String INVALID_TOKEN_CODE = "INVALID_TOKEN";
  private static final String INVALID_TOKEN_MESSAGE = "Invalid or expired token";
  private static final String INVALID_CREDENTIALS_CODE = "INVALID_CREDENTIALS";
  private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";
  private static final String EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED";
  private static final String EMAIL_NOT_VERIFIED_MESSAGE = "Email is not verified";
  private static final String ACCOUNT_DEACTIVATED_CODE = "ACCOUNT_DEACTIVATED";
  private static final String ACCOUNT_DEACTIVATED_MESSAGE = "Account is deactivated";
  private static final String ACCOUNT_LOCKED_CODE = "ACCOUNT_LOCKED";
  private static final String ACCOUNT_LOCKED_MESSAGE = "Account is temporarily locked";
  private static final String UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
  private static final String UNAUTHENTICATED_MESSAGE = "Authentication is required";
  private static final String TWO_FACTOR_INVALID_CODE = "TWO_FACTOR_INVALID";
  private static final String TWO_FACTOR_INVALID_MESSAGE = "Invalid or expired two-factor code";
  private static final String REGISTER_SUCCESS_MESSAGE =
    "Registration created. Please verify your email.";
  private static final String VERIFY_EMAIL_SUCCESS_MESSAGE = "Email verified";
  private static final String FORGOT_PASSWORD_MESSAGE =
    "Si votre compte existe, un email vous sera envoy\u00e9.";
  private static final String RESET_PASSWORD_SUCCESS_MESSAGE = "Password has been reset";
  private static final String VERIFY_EMAIL_SUBJECT = "Verify your email";
  private static final String TWO_FACTOR_SUBJECT = "Your authentication code";
  private static final String RESET_PASSWORD_SUBJECT = "Reset your password";
  private static final String VERIFY_EMAIL_FRONTEND_PATH = "/verify";
  private static final String RESET_PASSWORD_FRONTEND_PATH = "/reset-password";

  private final AuthProperties authProperties;
  private final CurrentUserService currentUserService;
  private final UserRepository userRepository;
  private final UserPasswordRepository userPasswordRepository;
  private final EmailVerificationTokenRepository emailVerificationTokenRepository;
  private final TwoFactorAuthRepository twoFactorAuthRepository;
  private final ForgotPasswordRepository forgotPasswordRepository;
  private final UserSessionRepository userSessionRepository;
  private final PasswordEncoder passwordEncoder;
  private final SecureTokenService secureTokenService;
  private final TokenHashService tokenHashService;
  private final TwoFactorCodeService twoFactorCodeService;
  private final JwtService jwtService;
  private final EmailQueueService emailQueueService;
  private final Clock clock;

  public AuthService(
    AuthProperties authProperties,
    CurrentUserService currentUserService,
    UserRepository userRepository,
    UserPasswordRepository userPasswordRepository,
    EmailVerificationTokenRepository emailVerificationTokenRepository,
    TwoFactorAuthRepository twoFactorAuthRepository,
    ForgotPasswordRepository forgotPasswordRepository,
    UserSessionRepository userSessionRepository,
    PasswordEncoder passwordEncoder,
    SecureTokenService secureTokenService,
    TokenHashService tokenHashService,
    TwoFactorCodeService twoFactorCodeService,
    JwtService jwtService,
    EmailQueueService emailQueueService,
    Clock clock
  ) {
    this.authProperties = authProperties;
    this.currentUserService = currentUserService;
    this.userRepository = userRepository;
    this.userPasswordRepository = userPasswordRepository;
    this.emailVerificationTokenRepository = emailVerificationTokenRepository;
    this.twoFactorAuthRepository = twoFactorAuthRepository;
    this.forgotPasswordRepository = forgotPasswordRepository;
    this.userSessionRepository = userSessionRepository;
    this.passwordEncoder = passwordEncoder;
    this.secureTokenService = secureTokenService;
    this.tokenHashService = tokenHashService;
    this.twoFactorCodeService = twoFactorCodeService;
    this.jwtService = jwtService;
    this.emailQueueService = emailQueueService;
    this.clock = clock;
  }

  @Transactional(readOnly = true)
  public AuthPublicConfigResponse getPublicConfig() {
    return new AuthPublicConfigResponse(authProperties.isRegisterEnabled());
  }

  @Transactional
  public AuthMessageResponse register(RegisterRequest request) {
    ensureRegisterEnabled();

    ensurePasswordsMatch(request.password(), request.confirmPassword());

    String email = normalizeEmail(request.email());
    if (userRepository.existsByEmailIgnoreCase(email)) {
      throw new ApiException(
        HttpStatus.CONFLICT,
        EMAIL_ALREADY_EXISTS_CODE,
        EMAIL_ALREADY_EXISTS_MESSAGE
      );
    }

    User user = userRepository.save(new User(
      PersonNameFormatter.formatLastname(request.lastname()),
      PersonNameFormatter.formatFirstname(request.firstname()),
      email
    ));

    userPasswordRepository.save(new UserPassword(
      user,
      passwordEncoder.encode(request.password())
    ));

    String token = secureTokenService.generateToken();
    emailVerificationTokenRepository.save(new EmailVerificationToken(
      user,
      tokenHashService.hashToken(token),
      Instant.now(clock).plus(AuthDurations.EMAIL_VERIFICATION_TOKEN_TTL)
    ));

    emailQueueService.enqueue(
      user.getEmail(),
      VERIFY_EMAIL_SUBJECT,
      "Verify your email: " + buildAdminTokenUrl(VERIFY_EMAIL_FRONTEND_PATH, token)
    );

    return new AuthMessageResponse(REGISTER_SUCCESS_MESSAGE);
  }

  @Transactional
  public AuthMessageResponse verifyEmail(String token) {
    Instant now = Instant.now(clock);
    EmailVerificationToken verificationToken = emailVerificationTokenRepository
      .findByTokenHash(tokenHashService.hashToken(token))
      .orElseThrow(() -> invalidTokenException());

    if (!verificationToken.isUsable(now)) {
      throw invalidTokenException();
    }

    verificationToken.getUser().verify(now);
    verificationToken.consume(now);

    return new AuthMessageResponse(VERIFY_EMAIL_SUCCESS_MESSAGE);
  }

  @Transactional
  public LoginResponse login(LoginRequest request) {
    Instant now = Instant.now(clock);
    User user = userRepository
      .findByEmailIgnoreCase(normalizeEmail(request.email()))
      .orElseThrow(() -> invalidCredentialsException());
    UserPassword password = userPasswordRepository
      .findByUser(user)
      .orElseThrow(() -> invalidCredentialsException());

    if (!passwordEncoder.matches(request.password(), password.getPasswordHash())) {
      throw invalidCredentialsException();
    }

    ensureUserCanLogin(user, now);

    String code = twoFactorCodeService.generateCode();
    twoFactorAuthRepository.save(new TwoFactorAuth(
      user,
      tokenHashService.hashTwoFactorCode(user.getId(), code),
      now.plus(AuthDurations.TWO_FACTOR_CODE_TTL)
    ));

    emailQueueService.enqueue(
      user.getEmail(),
      TWO_FACTOR_SUBJECT,
      "Your two-factor authentication code is: " + code
    );

    return new LoginResponse(true);
  }

  @Transactional
  public AuthSession verifyTwoFactor(VerifyTwoFactorRequest request) {
    Instant now = Instant.now(clock);
    User user = userRepository
      .findByEmailIgnoreCase(normalizeEmail(request.email()))
      .orElseThrow(() -> twoFactorException());

    TwoFactorAuth twoFactorAuth = twoFactorAuthRepository
      .findFirstByUserAndCodeHashAndVerifiedAtIsNullOrderByCreatedAtDesc(
        user,
        tokenHashService.hashTwoFactorCode(user.getId(), request.code())
      )
      .orElseThrow(() -> twoFactorException());

    if (!twoFactorAuth.isUsable(now)) {
      throw twoFactorException();
    }

    ensureUserCanLogin(user, now);

    twoFactorAuth.verify(now);
    return createSession(user, sessionDuration(request.rememberMe()), now);
  }

  @Transactional(readOnly = true)
  public AuthenticatedUserResponse me() {
    AuthenticatedUser currentUser = currentUserService.getCurrentUser();
    User user = userRepository
      .findById(currentUser.id())
      .orElseThrow(() -> unauthenticatedException());

    return authenticatedUserResponse(user);
  }

  @Transactional
  public AuthSession refresh(String token) {
    Instant now = Instant.now(clock);
    UserSession currentSession = findValidSession(token, now);

    currentSession.expire(now);
    return createSession(currentSession.getUser(), AuthDurations.DEFAULT_SESSION_TTL, now);
  }

  @Transactional
  public void logout(String token) {
    Instant now = Instant.now(clock);
    userSessionRepository
      .findByTokenHash(tokenHashService.hashJwt(token))
      .ifPresent(session -> session.expire(now));
  }

  @Transactional
  public AuthMessageResponse forgotPassword(ForgotPasswordRequest request) {
    String email = normalizeEmail(request.email());
    userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
      String token = secureTokenService.generateToken();
      forgotPasswordRepository.save(new ForgotPassword(
        email,
        tokenHashService.hashToken(token),
        Instant.now(clock).plus(AuthDurations.FORGOT_PASSWORD_TOKEN_TTL)
      ));

      emailQueueService.enqueue(
        user.getEmail(),
        RESET_PASSWORD_SUBJECT,
        "Reset your password: " + buildAdminTokenUrl(RESET_PASSWORD_FRONTEND_PATH, token)
      );
    });

    return new AuthMessageResponse(FORGOT_PASSWORD_MESSAGE);
  }

  @Transactional
  public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
    ensurePasswordsMatch(request.password(), request.confirmPassword());

    Instant now = Instant.now(clock);
    ForgotPassword forgotPassword = forgotPasswordRepository
      .findByTokenHash(tokenHashService.hashToken(request.token()))
      .orElseThrow(() -> invalidTokenException());

    if (!forgotPassword.isUsable(now)) {
      throw invalidTokenException();
    }

    User user = userRepository
      .findByEmailIgnoreCase(forgotPassword.getEmail())
      .orElseThrow(() -> invalidTokenException());
    UserPassword password = userPasswordRepository
      .findByUser(user)
      .orElseThrow(() -> invalidTokenException());

    password.updatePasswordHash(passwordEncoder.encode(request.password()));
    forgotPassword.consume(now);
    userSessionRepository.expireAllUserSessions(user.getId(), now);

    return new AuthMessageResponse(RESET_PASSWORD_SUCCESS_MESSAGE);
  }

  private void ensureUserCanLogin(User user, Instant now) {
    if (!user.isVerified()) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        EMAIL_NOT_VERIFIED_CODE,
        EMAIL_NOT_VERIFIED_MESSAGE
      );
    }

    if (!user.isActive()) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ACCOUNT_DEACTIVATED_CODE,
        ACCOUNT_DEACTIVATED_MESSAGE
      );
    }

    if (user.isLocked(now)) {
      throw new ApiException(HttpStatus.FORBIDDEN, ACCOUNT_LOCKED_CODE, ACCOUNT_LOCKED_MESSAGE);
    }
  }

  private void ensurePasswordsMatch(String password, String confirmPassword) {
    if (!password.equals(confirmPassword)) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        PASSWORD_MISMATCH_CODE,
        PASSWORD_MISMATCH_MESSAGE
      );
    }
  }

  private Duration sessionDuration(boolean rememberMe) {
    return rememberMe
      ? AuthDurations.REMEMBER_ME_SESSION_TTL
      : AuthDurations.DEFAULT_SESSION_TTL;
  }

  private AuthSession createSession(User user, Duration duration, Instant now) {
    Instant expiredAt = now.plus(duration);
    String jwt = jwtService.generateToken(user, expiredAt);

    userSessionRepository.save(new UserSession(
      user,
      tokenHashService.hashJwt(jwt),
      expiredAt
    ));

    return new AuthSession(jwt, expiredAt, authenticatedUserResponse(user));
  }

  private UserSession findValidSession(String token, Instant now) {
    String tokenHash = tokenHashService.hashJwt(token);
    JwtPayload payload = jwtService
      .parseAndValidateSignature(token)
      .orElseThrow(() -> unauthenticatedException());
    UserSession session = userSessionRepository
      .findByTokenHash(tokenHash)
      .orElseThrow(() -> unauthenticatedException());

    if (!session.getUser().getId().equals(payload.userId())
      || !session.isValid(now)
      || !session.getUser().isActive()) {
      throw unauthenticatedException();
    }

    return session;
  }

  private static AuthenticatedUserResponse authenticatedUserResponse(User user) {
    return new AuthenticatedUserResponse(UserResponse.from(user));
  }

  private void ensureRegisterEnabled() {
    if (!authProperties.isRegisterEnabled()) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        REGISTER_DISABLED_CODE,
        REGISTER_DISABLED_MESSAGE
      );
    }
  }

  private static String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private String buildAdminTokenUrl(String path, String token) {
    return stripTrailingSlash(authProperties.getAdminBaseUrl())
      + path
      + "?token="
      + URLEncoder.encode(token, StandardCharsets.UTF_8);
  }

  private static String stripTrailingSlash(String value) {
    int endIndex = value.length();
    while (endIndex > 0 && value.charAt(endIndex - 1) == '/') {
      endIndex--;
    }

    return value.substring(0, endIndex);
  }

  private static ApiException invalidTokenException() {
    return new ApiException(HttpStatus.BAD_REQUEST, INVALID_TOKEN_CODE, INVALID_TOKEN_MESSAGE);
  }

  private static ApiException invalidCredentialsException() {
    return new ApiException(
      HttpStatus.UNAUTHORIZED,
      INVALID_CREDENTIALS_CODE,
      INVALID_CREDENTIALS_MESSAGE
    );
  }

  private static ApiException twoFactorException() {
    return new ApiException(
      HttpStatus.UNAUTHORIZED,
      TWO_FACTOR_INVALID_CODE,
      TWO_FACTOR_INVALID_MESSAGE
    );
  }

  private static ApiException unauthenticatedException() {
    return new ApiException(
      HttpStatus.UNAUTHORIZED,
      UNAUTHENTICATED_CODE,
      UNAUTHENTICATED_MESSAGE
    );
  }
}
