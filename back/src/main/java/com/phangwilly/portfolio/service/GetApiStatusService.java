package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.model.ApiStatus;
import java.time.Clock;
import org.springframework.stereotype.Service;

@Service
public class GetApiStatusService {

  private static final String API_NAME = "portfolio-api";

  private final Clock clock;

  public GetApiStatusService(Clock clock) {
    this.clock = clock;
  }

  public ApiStatus getStatus() {
    return ApiStatus.up(API_NAME, clock);
  }
}
