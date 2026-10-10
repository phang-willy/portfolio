package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExperienceLocaleRequest(
  @NotBlank @Size(max = 255) String role,
  @Size(max = 500) String summary,
  @Size(max = 1_000_000) String content
) {}
