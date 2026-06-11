package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ChangePasswordRequest;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

  private static final String PASSWORD_CHANGED_MESSAGE = "Password changed";

  private final AccountService accountService;

  public AccountController(AccountService accountService) {
    this.accountService = accountService;
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
