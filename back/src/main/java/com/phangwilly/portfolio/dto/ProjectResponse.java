package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProjectResponse(
  UUID id,
  String slug,
  String productionLink,
  String sourceCodeLink,
  String imageLink,
  Instant createdAt,
  Instant updatedAt,
  List<ProjectStackItem> stacks,
  Localized<ProjectPublicLocale> lang,
  Instant githubCreatedAt,
  Instant githubUpdatedAt
) {}
