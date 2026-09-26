package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.model.Experience;
import com.phangwilly.portfolio.model.ExperienceContractType;

public record ExperiencePublicLocale(
  String role,
  String summary,
  String content,
  String contractType
) {

  public static ExperiencePublicLocale from(Experience experience) {
    if (experience == null) {
      return new ExperiencePublicLocale("", "", "", "");
    }

    return new ExperiencePublicLocale(
      nullToEmpty(experience.getRole()),
      nullToEmpty(experience.getSummary()),
      nullToEmpty(experience.getContent()),
      contractTypeTitle(experience.getContractType())
    );
  }

  private static String contractTypeTitle(ExperienceContractType contractType) {
    if (contractType == null || contractType.getDeletedAt() != null) {
      return "";
    }

    return nullToEmpty(contractType.getTitle());
  }

  private static String nullToEmpty(String value) {
    return value == null ? "" : value;
  }
}
