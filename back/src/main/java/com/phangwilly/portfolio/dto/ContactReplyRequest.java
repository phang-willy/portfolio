package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactReplyRequest(
  @NotBlank @Size(max = MESSAGE_MAX_LENGTH) String message,
  @Size(max = 500) String website
) {
  public static final int MESSAGE_MAX_LENGTH = 20_000;
}
