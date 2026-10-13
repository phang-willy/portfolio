package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProjectAdminListItem(
  UUID id,
  String slug,
  List<String> stackNames,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt,
  Localized<ProjectAdminListLocale> lang
) {}
