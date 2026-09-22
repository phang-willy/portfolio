package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ContactAdminDetail;
import com.phangwilly.portfolio.dto.ContactAdminListItem;
import com.phangwilly.portfolio.dto.ContactPresenceRequest;
import com.phangwilly.portfolio.dto.ContactPresenceState;
import com.phangwilly.portfolio.dto.ContactReadRequest;
import com.phangwilly.portfolio.dto.ContactReplyRequest;
import com.phangwilly.portfolio.dto.ContactUnreadCountResponse;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.ContactAdminService;
import com.phangwilly.portfolio.service.ContactPresenceService;
import com.phangwilly.portfolio.service.ContactRealtimeService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/admin/contact")
public class ContactAdminController {

  private final ContactAdminService contactAdminService;
  private final ContactPresenceService contactPresenceService;
  private final ContactRealtimeService contactRealtimeService;

  public ContactAdminController(
    ContactAdminService contactAdminService,
    ContactPresenceService contactPresenceService,
    ContactRealtimeService contactRealtimeService
  ) {
    this.contactAdminService = contactAdminService;
    this.contactPresenceService = contactPresenceService;
    this.contactRealtimeService = contactRealtimeService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<ContactAdminListItem>> getContacts(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size,
    @RequestParam(required = false) String search,
    @RequestParam(required = false) ContactStatus status
  ) {
    return ApiResponses.okPaginated(contactAdminService.getContacts(page, size, search, status));
  }

  @GetMapping("/unread-count")
  public ResponseEntity<ApiResponse<ContactUnreadCountResponse>> getUnreadCount() {
    return ApiResponses.ok(contactAdminService.getUnreadCount());
  }

  @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(HttpServletResponse response) {
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("X-Accel-Buffering", "no");
    return contactRealtimeService.subscribe();
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ContactAdminDetail>> getContact(@PathVariable UUID id) {
    return ApiResponses.ok(contactAdminService.getContact(id));
  }

  @PutMapping("/{id}/read")
  public ResponseEntity<ApiResponse<ContactAdminDetail>> markRead(
    @PathVariable UUID id, @Valid @RequestBody ContactReadRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }
    return ApiResponses.ok(contactAdminService.markRead(id));
  }

  @PostMapping("/{id}/reply")
  public ResponseEntity<ApiResponse<ContactAdminDetail>> reply(
    @PathVariable UUID id, @Valid @RequestBody ContactReplyRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }
    return ApiResponses.ok(contactAdminService.reply(id, request.message()));
  }

  @PutMapping("/{id}/presence")
  public ResponseEntity<ApiResponse<ContactPresenceState>> heartbeat(
    @PathVariable UUID id, @Valid @RequestBody ContactPresenceRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }
    return ApiResponses.ok(contactPresenceService.heartbeat(id, request.sessionId()));
  }

  @DeleteMapping("/{id}/presence")
  public ResponseEntity<ApiResponse<ContactPresenceState>> leave(
    @PathVariable UUID id, @RequestParam UUID sessionId
  ) {
    return ApiResponses.ok(contactPresenceService.leave(id, sessionId));
  }
}
