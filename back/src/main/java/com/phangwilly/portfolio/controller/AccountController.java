package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.AuthMessageResponse;
import com.phangwilly.portfolio.dto.ChangePasswordRequest;
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

  private final AccountService accountService;

  public AccountController(AccountService accountService) {
    this.accountService = accountService;
  }

  @PostMapping("/change-password")
  public ResponseEntity<AuthMessageResponse> changePassword(
    @Valid @RequestBody ChangePasswordRequest request
  ) {
    return ResponseEntity.ok(accountService.changePassword(request));
  }
}
