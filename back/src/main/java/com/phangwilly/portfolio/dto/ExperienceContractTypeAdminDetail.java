package com.phangwilly.portfolio.dto;

import java.util.UUID;

public record ExperienceContractTypeAdminDetail(
  UUID id,
  String slug,
  Localized<ExperienceContractTypeAdminLocale> lang
) {}
