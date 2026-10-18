package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.UUID;

public record ExperienceAdminListItem(
  UUID id,
  String company,
  Short yearStart,
  Short yearEnd,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt,
  Localized<ExperienceAdminListLocale> lang
) {}
