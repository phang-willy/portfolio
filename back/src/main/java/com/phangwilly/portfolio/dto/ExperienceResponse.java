package com.phangwilly.portfolio.dto;

import java.util.UUID;

public record ExperienceResponse(
  UUID id,
  String company,
  Short yearStart,
  Short yearEnd,
  ExperiencePublicLocale fr,
  ExperiencePublicLocale en
) {}
