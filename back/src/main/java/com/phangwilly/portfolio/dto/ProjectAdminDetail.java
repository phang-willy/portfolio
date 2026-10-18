package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProjectAdminDetail(
  UUID id,
  String slug,
  List<UUID> stackIds,
  String productionLink,
  String sourceCodeLink,
  String imageLink,
  Localized<ProjectLocaleRequest> lang,
  Instant githubCreatedAt,
  Instant githubUpdatedAt
) {}
