package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.AuthTokenResponse;
import com.phangwilly.portfolio.dto.ForgotPasswordRequest;
import com.phangwilly.portfolio.dto.LoginRequest;
import com.phangwilly.portfolio.dto.LoginResponse;
import com.phangwilly.portfolio.dto.RegisterRequest;
import com.phangwilly.portfolio.dto.ResetPasswordRequest;
import com.phangwilly.portfolio.dto.VerifyTwoFactorRequest;
import com.phangwilly.portfolio.service.AuthService;
import jakarta.validation.Valid;
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

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthMessageResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.ok(authService.register(request));
  }

  @GetMapping("/verify-email")
  public ResponseEntity<AuthMessageResponse> verifyEmail(@RequestParam String token) {
    return ResponseEntity.ok(authService.verifyEmail(token));
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @PostMapping("/verify-2fa")
  public ResponseEntity<AuthTokenResponse> verifyTwoFactor(
    @Valid @RequestBody VerifyTwoFactorRequest request
  ) {
    return ResponseEntity.ok(authService.verifyTwoFactor(request));
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<AuthMessageResponse> forgotPassword(
    @Valid @RequestBody ForgotPasswordRequest request
  ) {
    return ResponseEntity.ok(authService.forgotPassword(request));
  }

  @PostMapping("/reset-password")
  public ResponseEntity<AuthMessageResponse> resetPassword(
    @Valid @RequestBody ResetPasswordRequest request
  ) {
    return ResponseEntity.ok(authService.resetPassword(request));
  }
}
