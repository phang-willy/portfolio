package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Locale;
import java.util.Objects;

@Entity
@Table(name = "project")
public class Project extends AuditableEntity {

  private static final int TITLE_MAX_LENGTH = 160;
  private static final int SLUG_MAX_LENGTH = 255;
  private static final int DESCRIPTION_MAX_LENGTH = 160;
  private static final int LINK_MAX_LENGTH = 500;
  private static final int IMAGE_ALT_MAX_LENGTH = 255;
  private static final int LANG_MAX_LENGTH = 10;

  @Column(nullable = false, length = TITLE_MAX_LENGTH)
  private String title;

  @Column(nullable = false, length = SLUG_MAX_LENGTH)
  private String slug;

  @Column(length = DESCRIPTION_MAX_LENGTH)
  private String description;

  @Column(columnDefinition = "text")
  private String content;

  @Column(name = "production_link", length = LINK_MAX_LENGTH)
  private String productionLink;

  @Column(name = "source_code_link", length = LINK_MAX_LENGTH)
  private String sourceCodeLink;

  @Column(name = "image_link", length = LINK_MAX_LENGTH)
  private String imageLink;

  @Column(name = "image_alt", length = IMAGE_ALT_MAX_LENGTH)
  private String imageAlt;

  @Column(nullable = false, length = LANG_MAX_LENGTH)
  private String lang;

  @Column(name = "deactivated_at")
  private Instant deactivatedAt;

  @Column(name = "github_created_at")
  private Instant githubCreatedAt;

  @Column(name = "github_updated_at")
  private Instant githubUpdatedAt;

  @Column(name = "github_repo", length = 200)
  private String githubRepo;

  protected Project() {
  }

  public Project(
    String title,
    String slug,
    String description,
    String content,
    String productionLink,
    String sourceCodeLink,
    String imageLink,
    String imageAlt,
    String lang
  ) {
    this.title = title;
    this.slug = slug;
    this.description = description;
    this.content = content;
    this.productionLink = productionLink;
    this.sourceCodeLink = sourceCodeLink;
    this.imageLink = imageLink;
    this.imageAlt = imageAlt;
    this.lang = lang;
  }

  public String getTitle() {
    return title;
  }

  public String getSlug() {
    return slug;
  }

  public String getDescription() {
    return description;
  }

  public String getContent() {
    return content;
  }

  public String getProductionLink() {
    return productionLink;
  }

  public String getSourceCodeLink() {
    return sourceCodeLink;
  }

  public String getImageLink() {
    return imageLink;
  }

  public String getImageAlt() {
    return imageAlt;
  }

  public String getLang() {
    return lang;
  }

  public Instant getDeactivatedAt() {
    return deactivatedAt;
  }

  public Instant getGithubCreatedAt() {
    return githubCreatedAt;
  }

  public Instant getGithubUpdatedAt() {
    return githubUpdatedAt;
  }

  public String getGithubRepo() {
    return githubRepo;
  }

  public boolean applyGithubDates(Instant createdAt, Instant updatedAt) {
    if (Objects.equals(githubCreatedAt, createdAt) && Objects.equals(githubUpdatedAt, updatedAt)) {
      return false;
    }
    githubCreatedAt = createdAt;
    githubUpdatedAt = updatedAt;
    return true;
  }

  public boolean applyGithubSnapshot(String repoKey, Instant createdAt, Instant updatedAt) {
    String normalizedRepo = normalizeRepoKey(repoKey);
    if (
      Objects.equals(githubRepo, normalizedRepo) &&
      Objects.equals(githubCreatedAt, createdAt) &&
      Objects.equals(githubUpdatedAt, updatedAt)
    ) {
      return false;
    }
    githubRepo = normalizedRepo;
    githubCreatedAt = createdAt;
    githubUpdatedAt = updatedAt;
    return true;
  }

  public boolean clearGithubDates() {
    if (githubCreatedAt == null && githubUpdatedAt == null && githubRepo == null) {
      return false;
    }
    githubCreatedAt = null;
    githubUpdatedAt = null;
    githubRepo = null;
    return true;
  }

  private static String normalizeRepoKey(String repoKey) {
    if (repoKey == null || repoKey.isBlank()) {
      return null;
    }
    return repoKey.trim().toLowerCase(Locale.ROOT);
  }

  public void markDeactivated() {
    this.deactivatedAt = Instant.now();
  }

  public void reactivate() {
    this.deactivatedAt = null;
  }

  public void updateDetails(
    String title,
    String slug,
    String description,
    String content,
    String productionLink,
    String sourceCodeLink,
    String imageLink,
    String imageAlt,
    String lang
  ) {
    this.title = title;
    this.slug = slug;
    this.description = description;
    this.content = content;
    this.productionLink = productionLink;
    this.sourceCodeLink = sourceCodeLink;
    this.imageLink = imageLink;
    this.imageAlt = imageAlt;
    this.lang = lang;
  }
}
