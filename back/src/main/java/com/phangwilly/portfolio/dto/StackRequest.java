package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StackRequest(
  @NotBlank @Size(max = 255) String name,
  @Size(max = 65536) String image,
  @Size(max = 500) String website
) {}
