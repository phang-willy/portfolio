package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectLocaleRequest(
  @NotBlank @Size(max = 160) String title,
  @Size(max = 160) String description,
  @Size(max = 1_000_000) String content,
  @Size(max = 255) String imageAlt
) {}
