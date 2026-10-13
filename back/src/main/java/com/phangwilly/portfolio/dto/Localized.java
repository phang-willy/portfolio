package com.phangwilly.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record Localized<T>(
  @NotNull @Valid T fr,
  @NotNull @Valid T en
) {}
