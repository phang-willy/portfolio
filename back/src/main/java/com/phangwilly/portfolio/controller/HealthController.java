package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.HealthResponse;
import com.phangwilly.portfolio.service.GetApiStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

  private final GetApiStatusService getApiStatusService;

  public HealthController(GetApiStatusService getApiStatusService) {
    this.getApiStatusService = getApiStatusService;
  }

  @GetMapping("/health")
  public ResponseEntity<HealthResponse> health() {
    return ResponseEntity.ok(HealthResponse.from(getApiStatusService.getStatus()));
  }
}
