package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.NotificationReadRequest;
import com.phangwilly.portfolio.dto.NotificationResponse;
import com.phangwilly.portfolio.dto.NotificationUnreadCountResponse;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.NotificationRealtimeService;
import com.phangwilly.portfolio.service.NotificationService;
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
@RequestMapping("/api/admin/notification")
public class NotificationAdminController {

  private final NotificationService notificationService;
  private final NotificationRealtimeService realtimeService;

  public NotificationAdminController(
    NotificationService notificationService,
    NotificationRealtimeService realtimeService
  ) {
    this.notificationService = notificationService;
    this.realtimeService = realtimeService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<NotificationResponse>> list(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(notificationService.list(page, size));
  }

  @GetMapping("/unread-count")
  public ResponseEntity<ApiResponse<NotificationUnreadCountResponse>> unreadCount() {
    return ApiResponses.ok(notificationService.unreadCount());
  }

  @PutMapping("/read/{id}")
  public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
    @PathVariable UUID id,
    @Valid @RequestBody NotificationReadRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }
    return ApiResponses.ok(notificationService.markRead(id));
  }

  @PutMapping("/read")
  public ResponseEntity<ApiResponse<NotificationUnreadCountResponse>> markAllRead(
    @Valid @RequestBody NotificationReadRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(new NotificationUnreadCountResponse(0));
    }
    return ApiResponses.ok(notificationService.markAllRead());
  }

  @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(HttpServletResponse response) {
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("X-Accel-Buffering", "no");
    return realtimeService.subscribe();
  }
}
