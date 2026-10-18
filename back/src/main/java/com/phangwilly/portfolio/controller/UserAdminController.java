package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.EmailAvailabilityResponse;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.dto.UserAdminActionRequest;
import com.phangwilly.portfolio.dto.UserAdminDetail;
import com.phangwilly.portfolio.dto.UserAdminListItem;
import com.phangwilly.portfolio.dto.UserAdminUpdateRequest;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.UserAdminService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/user")
public class UserAdminController {

  private final UserAdminService userAdminService;

  public UserAdminController(UserAdminService userAdminService) {
    this.userAdminService = userAdminService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<UserAdminListItem>> getUsers(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(userAdminService.getUsers(page, size));
  }

  @GetMapping("/email-available")
  public ResponseEntity<ApiResponse<EmailAvailabilityResponse>> emailAvailable(
    @RequestParam String email,
    @RequestParam UUID userId
  ) {
    return ApiResponses.ok(userAdminService.emailAvailable(email, userId));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<UserAdminDetail>> getUser(@PathVariable UUID id) {
    return ApiResponses.ok(userAdminService.getUser(id));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<UserAdminDetail>> update(
    @PathVariable UUID id,
    @Valid @RequestBody UserAdminUpdateRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(userAdminService.update(id, request));
  }

  @PutMapping("/password-reset/{id}")
  public ResponseEntity<ApiResponse<UserAdminDetail>> requestPasswordReset(
    @PathVariable UUID id,
    @Valid @RequestBody UserAdminActionRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(userAdminService.requestPasswordReset(id));
  }
}
