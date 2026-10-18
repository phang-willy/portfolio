package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.AuthPublicConfigResponse;
import com.phangwilly.portfolio.dto.ForgotPasswordRequest;
import com.phangwilly.portfolio.dto.LoginRequest;
import com.phangwilly.portfolio.dto.LoginResponse;
import com.phangwilly.portfolio.dto.RegisterRequest;
import com.phangwilly.portfolio.dto.ResetPasswordRequest;
import com.phangwilly.portfolio.dto.VerifyTwoFactorRequest;
import com.phangwilly.portfolio.security.AuthCookieService;
import com.phangwilly.portfolio.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  @Mock
  private AuthService authService;

  @Mock
  private AuthCookieService authCookieService;

  private AuthController controller;

  @BeforeEach
  void setUp() {
    controller = new AuthController(authService, authCookieService);
  }

  @Test
  void returnsPublicConfig() {
    when(authService.getPublicConfig()).thenReturn(new AuthPublicConfigResponse(true));

    var response = controller.config();

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data().registerEnabled()).isTrue();
  }

  @Test
  void registerSkipsServiceWhenHoneypotIsFilled() {
    var request = new RegisterRequest(
      "Dupont",
      "Willy",
      "willy@example.com",
      "password1",
      "password1",
      "https://spam.example"
    );

    var response = controller.register(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message())
      .isEqualTo("Registration created. Please verify your email.");
    verifyNoInteractions(authService);
  }

  @Test
  void registerDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new RegisterRequest(
      "Dupont",
      "Willy",
      "willy@example.com",
      "password1",
      "password1",
      null
    );
    when(authService.register(request))
      .thenReturn(new AuthMessageResponse("Registration created. Please verify your email."));

    var response = controller.register(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    verify(authService).register(request);
  }

  @Test
  void loginReturnsDecoyResponseWhenHoneypotIsFilled() {
    var request = new LoginRequest("willy@example.com", "password1", "bot");

    var response = controller.login(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data().requiresTwoFactor()).isFalse();
    verifyNoInteractions(authService);
  }

  @Test
  void loginDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new LoginRequest("willy@example.com", "password1", null);
    when(authService.login(request)).thenReturn(new LoginResponse(true));

    var response = controller.login(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data().requiresTwoFactor()).isTrue();
    verify(authService).login(request);
  }

  @Test
  void forgotPasswordSkipsServiceWhenHoneypotIsFilled() {
    var request = new ForgotPasswordRequest("willy@example.com", "spam");

    var response = controller.forgotPassword(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message())
      .isEqualTo("Si votre compte existe, un email vous sera envoy\u00e9.");
    verifyNoInteractions(authService);
  }

  @Test
  void resetPasswordSkipsServiceWhenHoneypotIsFilled() {
    var request = new ResetPasswordRequest("token", "password1", "password1", "spam");

    var response = controller.resetPassword(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Password has been reset");
    verifyNoInteractions(authService);
  }

  @Test
  void verifyTwoFactorSkipsServiceWhenHoneypotIsFilled() {
    var request = new VerifyTwoFactorRequest("willy@example.com", "123456", false, "spam");
    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<?> result = controller.verifyTwoFactor(request, response);

    assertThat(result.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(result.getBody()).isNotNull();
    verifyNoInteractions(authService, authCookieService);
  }
}
