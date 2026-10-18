package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
  @NotBlank @Email @Size(max = 320) String email,
  @NotBlank @Size(max = 255) String password,
  @Size(max = 500) String website
) {
}
