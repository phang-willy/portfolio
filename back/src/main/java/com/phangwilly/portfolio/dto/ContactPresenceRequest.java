package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ContactPresenceRequest(
  @NotNull UUID sessionId,
  @Size(max = 500) String website
) {}
