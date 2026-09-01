package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.dto.EmailQueueFailedCountResponse;
import com.phangwilly.portfolio.dto.EmailQueueResendRequest;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.EmailQueueAdminService;
import com.phangwilly.portfolio.service.EmailQueueRealtimeService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/admin/email-queue")
public class EmailQueueAdminController {

  private final EmailQueueAdminService emailQueueAdminService;
  private final EmailQueueRealtimeService emailQueueRealtimeService;

  public EmailQueueAdminController(
    EmailQueueAdminService emailQueueAdminService,
    EmailQueueRealtimeService emailQueueRealtimeService
  ) {
    this.emailQueueAdminService = emailQueueAdminService;
    this.emailQueueRealtimeService = emailQueueRealtimeService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<EmailQueueAdminListItem>> getEmails(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(emailQueueAdminService.getEmails(page, size));
  }

  @GetMapping("/failed-count")
  public ResponseEntity<ApiResponse<EmailQueueFailedCountResponse>> getFailedCount() {
    return ApiResponses.ok(emailQueueAdminService.getFailedCount());
  }

  @PutMapping("/resend/{id}")
  public ResponseEntity<ApiResponse<EmailQueueAdminListItem>> resend(
    @PathVariable UUID id,
    @Valid @RequestBody EmailQueueResendRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(emailQueueAdminService.resend(id));
  }

  @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(HttpServletResponse response) {
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("X-Accel-Buffering", "no");
    return emailQueueRealtimeService.subscribe();
  }
}
