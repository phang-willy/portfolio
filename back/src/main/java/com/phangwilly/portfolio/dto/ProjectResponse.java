package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.model.Project;
import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
  UUID id,
  String title,
  String slug,
  String description,
  String content,
  String productionLink,
  String sourceCodeLink,
  String imageLink,
  String imageAlt,
  String lang,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt
) {

  public static ProjectResponse from(Project project) {
    return new ProjectResponse(
      project.getId(),
      project.getTitle(),
      project.getSlug(),
      project.getDescription(),
      project.getContent(),
      project.getProductionLink(),
      project.getSourceCodeLink(),
      project.getImageLink(),
      project.getImageAlt(),
      project.getLang(),
      project.getCreatedAt(),
      project.getUpdatedAt(),
      project.getDeactivatedAt()
    );
  }
}
