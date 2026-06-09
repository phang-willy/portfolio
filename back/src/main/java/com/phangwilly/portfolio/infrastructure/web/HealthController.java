package com.phangwilly.portfolio.infrastructure.web;

import com.phangwilly.portfolio.application.port.in.GetApiStatusUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthController {

  private final GetApiStatusUseCase getApiStatus;

  public HealthController(GetApiStatusUseCase getApiStatus) {
    this.getApiStatus = getApiStatus;
  }

  @GetMapping("/health")
  public ResponseEntity<HealthResponse> health() {
    return ResponseEntity.ok(HealthResponse.from(getApiStatus.getStatus()));
  }
}
