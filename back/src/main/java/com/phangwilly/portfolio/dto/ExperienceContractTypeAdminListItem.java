package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.UUID;

public record ExperienceContractTypeAdminListItem(
  UUID id,
  String slug,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt,
  Localized<ExperienceContractTypeAdminLocale> lang
) {}
