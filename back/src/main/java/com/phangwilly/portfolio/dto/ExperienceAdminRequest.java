package com.phangwilly.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record ExperienceAdminRequest(
  @NotBlank @Size(max = 255) String company,
  @NotNull @Min(1900) @Max(2100) Short yearStart,
  @Min(1900) @Max(2100) Short yearEnd,
  UUID contractTypeId,
  @NotNull @Valid ExperienceLocaleRequest fr,
  @NotNull @Valid ExperienceLocaleRequest en,
  @Size(max = 500) String website
) {}
