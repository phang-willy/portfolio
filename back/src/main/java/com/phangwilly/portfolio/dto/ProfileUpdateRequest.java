package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
  @NotBlank @Size(max = 255) String lastname,
  @NotBlank @Size(max = 255) String firstname,
  @NotBlank @Email @Size(max = 320) String email,
  boolean confirmEmailChange,
  @Size(max = 500) String website
) {
}
