package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.AuthPublicConfigResponse;
import com.phangwilly.portfolio.dto.AuthenticatedUserResponse;
import com.phangwilly.portfolio.dto.ForgotPasswordRequest;
import com.phangwilly.portfolio.dto.LoginRequest;
import com.phangwilly.portfolio.dto.LoginResponse;
import com.phangwilly.portfolio.dto.RegisterRequest;
import com.phangwilly.portfolio.dto.ResetPasswordRequest;
import com.phangwilly.portfolio.dto.VerifyTwoFactorRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.security.AuthCookieService;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.AuthSession;
import com.phangwilly.portfolio.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  private static final String UNAUTHENTICATED_CODE = "UNAUTHENTICATED";
  private static final String UNAUTHENTICATED_MESSAGE = "Authentication is required";
  private static final String REGISTER_SUCCESS_MESSAGE =
    "Registration created. Please verify your email.";
  private static final String FORGOT_PASSWORD_MESSAGE =
    "Si votre compte existe, un email vous sera envoy\u00e9.";
  private static final String RESET_PASSWORD_SUCCESS_MESSAGE = "Password has been reset";

  private final AuthService authService;
  private final AuthCookieService authCookieService;

  public AuthController(AuthService authService, AuthCookieService authCookieService) {
    this.authService = authService;
    this.authCookieService = authCookieService;
  }

  @GetMapping("/config")
  public ResponseEntity<ApiResponse<AuthPublicConfigResponse>> config() {
    return ApiResponses.ok(authService.getPublicConfig());
  }

  @PostMapping("/register")
  public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(REGISTER_SUCCESS_MESSAGE);
    }

    return ApiResponses.okMessage(authService.register(request).message());
  }

  @GetMapping("/verify-email")
  public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam String token) {
    return ApiResponses.okMessage(authService.verifyEmail(token).message());
  }

  @PostMapping("/login")
  public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(new LoginResponse(false));
    }

    return ApiResponses.ok(authService.login(request));
  }

  @PostMapping("/verify-2fa")
  public ResponseEntity<ApiResponse<AuthenticatedUserResponse>> verifyTwoFactor(
    @Valid @RequestBody VerifyTwoFactorRequest request,
    HttpServletResponse response
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK, null, null));
    }

    AuthSession session = authService.verifyTwoFactor(request);
    authCookieService.addSessionCookie(response, session.token(), session.expiredAt());

    return ApiResponses.ok(session.authenticatedUser());
  }

  @GetMapping("/me")
  public ResponseEntity<ApiResponse<AuthenticatedUserResponse>> me() {
    return ApiResponses.ok(authService.me());
  }

  @PostMapping("/refresh")
  public ResponseEntity<ApiResponse<Void>> refresh(
    HttpServletRequest request,
    HttpServletResponse response
  ) {
    AuthSession session = authService.refresh(resolveToken(request));
    authCookieService.addSessionCookie(response, session.token(), session.expiredAt());

    return ApiResponses.ok();
  }

  @PostMapping("/logout")
  public ResponseEntity<ApiResponse<Void>> logout(
    HttpServletRequest request,
    HttpServletResponse response
  ) {
    authCookieService
      .resolveToken(request)
      .ifPresent(authService::logout);
    authCookieService.clearSessionCookie(response);

    return ApiResponses.ok();
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<ApiResponse<Void>> forgotPassword(
    @Valid @RequestBody ForgotPasswordRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(FORGOT_PASSWORD_MESSAGE);
    }

    return ApiResponses.okMessage(authService.forgotPassword(request).message());
  }

  @PostMapping("/reset-password")
  public ResponseEntity<ApiResponse<Void>> resetPassword(
    @Valid @RequestBody ResetPasswordRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(RESET_PASSWORD_SUCCESS_MESSAGE);
    }

    return ApiResponses.okMessage(authService.resetPassword(request).message());
  }

  private String resolveToken(HttpServletRequest request) {
    return authCookieService
      .resolveToken(request)
      .orElseThrow(() -> new ApiException(
        HttpStatus.UNAUTHORIZED,
        UNAUTHENTICATED_CODE,
        UNAUTHENTICATED_MESSAGE
      ));
  }
}
