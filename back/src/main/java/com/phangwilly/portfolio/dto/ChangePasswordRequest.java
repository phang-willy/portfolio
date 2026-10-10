package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
  @NotBlank @Size(max = 255) String oldPassword,
  @NotBlank @Size(min = 8, max = 255) String newPassword,
  @NotBlank @Size(min = 8, max = 255) String confirmPassword,
  @Size(max = 500) String website
) {
}
