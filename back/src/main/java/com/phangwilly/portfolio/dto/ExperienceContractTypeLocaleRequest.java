package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExperienceContractTypeLocaleRequest(
  @NotBlank @Size(max = 255) String title
) {}
