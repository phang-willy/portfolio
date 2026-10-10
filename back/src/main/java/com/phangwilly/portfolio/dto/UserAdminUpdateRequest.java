package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserAdminUpdateRequest(
  @NotBlank @Size(max = 255) String lastname,
  @NotBlank @Size(max = 255) String firstname,
  @NotNull UserRole role,
  @NotNull Boolean active,
  @NotBlank @Email @Size(max = 320) String email,
  boolean confirmEmailChange,
  @Size(max = 500) String website
) {
}
