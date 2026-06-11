package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import com.phangwilly.portfolio.config.AuthProperties;
import com.phangwilly.portfolio.dto.AuthPublicConfigResponse;
import com.phangwilly.portfolio.dto.RegisterRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.security.JwtService;
import com.phangwilly.portfolio.security.SecureTokenService;
import com.phangwilly.portfolio.security.TokenHashService;
import com.phangwilly.portfolio.security.TwoFactorCodeService;
import com.phangwilly.portfolio.repository.EmailVerificationTokenRepository;
import com.phangwilly.portfolio.repository.ForgotPasswordRepository;
import com.phangwilly.portfolio.repository.TwoFactorAuthRepository;
import com.phangwilly.portfolio.repository.UserPasswordRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.repository.UserSessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceConfigTest {

  @Test
  void exposesRegisterEnabledFlagInPublicConfig() {
    AuthProperties properties = new AuthProperties();
    properties.setRegisterEnabled(true);
    AuthService authService = createAuthService(properties);

    AuthPublicConfigResponse config = authService.getPublicConfig();

    assertThat(config.registerEnabled()).isTrue();
  }

  @Test
  void rejectsRegistrationWhenFeatureIsDisabled() {
    AuthProperties properties = new AuthProperties();
    properties.setRegisterEnabled(false);
    AuthService authService = createAuthService(properties);
    RegisterRequest request = new RegisterRequest(
      "Dupont",
      "Willy",
      "willy@example.com",
      "password1",
      "password1",
      null
    );

    assertThatThrownBy(() -> authService.register(request))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiException = (ApiException) error;
        assertThat(apiException.status()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(apiException.getMessage()).isEqualTo("Registration is disabled");
      });
  }

  private static AuthService createAuthService(AuthProperties properties) {
    return new AuthService(
      properties,
      mock(CurrentUserService.class),
      mock(UserRepository.class),
      mock(UserPasswordRepository.class),
      mock(EmailVerificationTokenRepository.class),
      mock(TwoFactorAuthRepository.class),
      mock(ForgotPasswordRepository.class),
      mock(UserSessionRepository.class),
      mock(PasswordEncoder.class),
      mock(SecureTokenService.class),
      mock(TokenHashService.class),
      mock(TwoFactorCodeService.class),
      mock(JwtService.class),
      mock(EmailQueueService.class),
      Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC)
    );
  }
}
