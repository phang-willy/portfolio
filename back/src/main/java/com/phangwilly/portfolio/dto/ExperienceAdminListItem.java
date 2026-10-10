package com.phangwilly.portfolio.dto;

import java.time.Instant;
import java.util.UUID;

public record ExperienceAdminListItem(
  UUID id,
  String company,
  String roleFr,
  String contractTypeFr,
  String contractTypeEn,
  Short yearStart,
  Short yearEnd,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt
) {}
