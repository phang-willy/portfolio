package com.phangwilly.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExperienceContractTypeAdminRequest(
  @NotNull @Valid ExperienceContractTypeLocaleRequest fr,
  @NotNull @Valid ExperienceContractTypeLocaleRequest en,
  @Size(max = 500) String website
) {}
