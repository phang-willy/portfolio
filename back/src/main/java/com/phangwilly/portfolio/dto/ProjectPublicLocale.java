package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.model.Project;

public record ProjectPublicLocale(
  String title,
  String description,
  String content,
  String imageAlt
) {

  public static ProjectPublicLocale from(Project project) {
    if (project == null) {
      return new ProjectPublicLocale("", "", "", "");
    }

    return new ProjectPublicLocale(
      nullToEmpty(project.getTitle()),
      nullToEmpty(project.getDescription()),
      nullToEmpty(project.getContent()),
      nullToEmpty(project.getImageAlt())
    );
  }

  private static String nullToEmpty(String value) {
    return value == null ? "" : value;
  }
}
