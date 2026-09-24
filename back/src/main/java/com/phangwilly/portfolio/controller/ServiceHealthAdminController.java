package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ServiceHealthCheckResponse;
import com.phangwilly.portfolio.dto.ServiceRestartRequest;
import com.phangwilly.portfolio.dto.ServiceRestartResponse;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.ServiceHealthRealtimeService;
import com.phangwilly.portfolio.service.ServiceRestartService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/admin/service-health")
public class ServiceHealthAdminController {

  private final CurrentUserService currentUserService;
  private final ServiceHealthRealtimeService realtimeService;
  private final ServiceRestartService restartService;

  public ServiceHealthAdminController(
    CurrentUserService currentUserService,
    ServiceHealthRealtimeService realtimeService,
    ServiceRestartService restartService
  ) {
    this.currentUserService = currentUserService;
    this.realtimeService = realtimeService;
    this.restartService = restartService;
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<ServiceHealthCheckResponse>>> getHealth() {
    currentUserService.requireAdmin();
    return ApiResponses.ok(realtimeService.current());
  }

  @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  public SseEmitter stream(HttpServletResponse response) {
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("X-Accel-Buffering", "no");
    return realtimeService.subscribe();
  }

  @PostMapping("/restart/{code}")
  public ResponseEntity<ApiResponse<ServiceRestartResponse>> restart(
    @PathVariable String code,
    @Valid @RequestBody ServiceRestartRequest request
  ) {
    currentUserService.requireAdmin();
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(ServiceRestartResponse.idle(code, ServiceRestartService.MAX_ATTEMPTS));
    }
    return ApiResponses.ok(restartService.start(code));
  }

  @GetMapping("/restart/{code}")
  public ResponseEntity<ApiResponse<ServiceRestartResponse>> restartProgress(@PathVariable String code) {
    currentUserService.requireAdmin();
    return ApiResponses.ok(restartService.progress(code));
  }
}
