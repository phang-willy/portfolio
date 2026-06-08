package com.phangwilly.portfolio.application.service;

import java.time.Clock;

import org.springframework.stereotype.Service;

import com.phangwilly.portfolio.application.port.in.GetApiStatusUseCase;
import com.phangwilly.portfolio.domain.model.ApiStatus;

@Service
public class GetApiStatusService implements GetApiStatusUseCase {

  private static final String API_NAME = "portfolio";

  private final Clock clock;

  public GetApiStatusService(Clock clock) {
    this.clock = clock;
  }

  @Override
  public ApiStatus getStatus() {
    return ApiStatus.up(API_NAME, clock);
  }
}
