package com.phangwilly.portfolio.dto;

import java.util.UUID;

public record ExperienceAdminDetail(
  UUID id,
  String company,
  Short yearStart,
  Short yearEnd,
  UUID contractTypeId,
  String slugFr,
  String slugEn,
  ExperienceLocaleRequest fr,
  ExperienceLocaleRequest en
) {}
