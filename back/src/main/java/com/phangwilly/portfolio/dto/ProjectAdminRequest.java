package com.phangwilly.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record ProjectAdminRequest(
  @NotBlank
  @Size(max = 255)
  @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Slug must be lowercase alphanumeric with hyphens")
  String slug,
  @NotNull @Valid Localized<ProjectLocaleRequest> lang,
  List<UUID> stackIds,
  @Size(max = 500)
  @Pattern(
    regexp = "^(?:https?://\\S+)?$",
    flags = Pattern.Flag.CASE_INSENSITIVE,
    message = "Link must be an http(s) URL"
  )
  String productionLink,
  @Size(max = 500)
  @Pattern(
    regexp = "^(?:https?://\\S+)?$",
    flags = Pattern.Flag.CASE_INSENSITIVE,
    message = "Link must be an http(s) URL"
  )
  String sourceCodeLink,
  @Size(max = 500) String imageLink,
  @Size(max = 500) String website
) {}
