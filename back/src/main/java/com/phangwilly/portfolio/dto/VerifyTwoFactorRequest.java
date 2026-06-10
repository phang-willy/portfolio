package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerifyTwoFactorRequest(
  @NotBlank @Email @Size(max = 320) String email,
  @NotBlank @Pattern(regexp = "\\d{6}") String code,
  boolean rememberMe
) {
}
