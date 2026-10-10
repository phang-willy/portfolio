package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.UUID;

public record ExperienceContractTypeAdminListItem(
  UUID id,
  String slug,
  String codeFr,
  String codeEn,
  String titleFr,
  String titleEn,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt
) {}
