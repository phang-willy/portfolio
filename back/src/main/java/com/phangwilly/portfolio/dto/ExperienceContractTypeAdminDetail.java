package com.phangwilly.portfolio.dto;

import java.util.UUID;

public record ExperienceContractTypeAdminDetail(
  UUID id,
  String slug,
  String codeFr,
  String codeEn,
  ExperienceContractTypeLocaleRequest fr,
  ExperienceContractTypeLocaleRequest en
) {}
