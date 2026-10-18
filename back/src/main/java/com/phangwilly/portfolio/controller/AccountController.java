package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ChangePasswordRequest;
import com.phangwilly.portfolio.dto.EmailAvailabilityResponse;
import com.phangwilly.portfolio.dto.ProfileUpdateRequest;
import com.phangwilly.portfolio.dto.ProfileUpdateResponse;
import com.phangwilly.portfolio.security.AuthCookieService;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.AccountService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

  private static final String PASSWORD_CHANGED_MESSAGE = "Password changed";

  private final AccountService accountService;
  private final AuthCookieService authCookieService;

  public AccountController(AccountService accountService, AuthCookieService authCookieService) {
    this.accountService = accountService;
    this.authCookieService = authCookieService;
  }

  @GetMapping("/email-available")
  public ResponseEntity<ApiResponse<EmailAvailabilityResponse>> emailAvailable(
    @RequestParam String email
  ) {
    return ApiResponses.ok(accountService.emailAvailable(email));
  }

  @PutMapping("/profile")
  public ResponseEntity<ApiResponse<ProfileUpdateResponse>> updateProfile(
    @Valid @RequestBody ProfileUpdateRequest request,
    HttpServletResponse response
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    ProfileUpdateResponse updated = accountService.updateProfile(request);
    if (updated.signedOut()) {
      authCookieService.clearSessionCookie(response);
    }

    return ApiResponses.ok(updated);
  }

  @PostMapping("/change-password")
  public ResponseEntity<ApiResponse<Void>> changePassword(
    @Valid @RequestBody ChangePasswordRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(PASSWORD_CHANGED_MESSAGE);
    }

    return ApiResponses.okMessage(accountService.changePassword(request).message());
  }
}
