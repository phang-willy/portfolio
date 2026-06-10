package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.AuthDurations;
import com.phangwilly.portfolio.config.AuthProperties;
import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.AuthTokenResponse;
import com.phangwilly.portfolio.dto.ForgotPasswordRequest;
import com.phangwilly.portfolio.dto.LoginRequest;
import com.phangwilly.portfolio.dto.LoginResponse;
import com.phangwilly.portfolio.dto.RegisterRequest;
import com.phangwilly.portfolio.dto.ResetPasswordRequest;
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
import com.phangwilly.portfolio.security.JwtService;
import com.phangwilly.portfolio.security.SecureTokenService;
import com.phangwilly.portfolio.security.TokenHashService;
import com.phangwilly.portfolio.security.TwoFactorCodeService;
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

  private final AuthProperties authProperties;
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

  @Transactional
  public AuthMessageResponse register(RegisterRequest request) {
    if (!authProperties.isRegisterEnabled()) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        REGISTER_DISABLED_CODE,
        REGISTER_DISABLED_MESSAGE
      );
    }

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
      request.lastname().trim(),
      request.firstname().trim(),
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
      "Verify your email: " + authProperties.getPublicBaseUrl()
        + "/api/auth/verify-email?token=" + token
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
  public AuthTokenResponse verifyTwoFactor(VerifyTwoFactorRequest request) {
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
    Instant expiredAt = now.plus(sessionDuration(request.rememberMe()));
    String jwt = jwtService.generateToken(user, expiredAt);
    userSessionRepository.save(new UserSession(
      user,
      tokenHashService.hashJwt(jwt),
      expiredAt
    ));

    return new AuthTokenResponse(jwt, expiredAt);
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
        "Reset your password: " + authProperties.getAdminBaseUrl()
          + "/reset-password?token=" + token
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

  private static String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
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
}
