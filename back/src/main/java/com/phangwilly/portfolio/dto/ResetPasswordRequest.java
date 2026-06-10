package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
  @NotBlank @Size(max = 500) String token,
  @NotBlank @Size(min = 8, max = 255) String password,
  @NotBlank @Size(min = 8, max = 255) String confirmPassword
) {
}
