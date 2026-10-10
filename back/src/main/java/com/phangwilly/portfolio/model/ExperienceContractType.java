package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "experience_contract_type")
public class ExperienceContractType extends AuditableEntity {

  private static final int SLUG_MAX_LENGTH = 255;
  private static final int CODE_MAX_LENGTH = 255;
  private static final int TITLE_MAX_LENGTH = 255;
  private static final int LANG_MAX_LENGTH = 10;

  @Column(nullable = false, length = SLUG_MAX_LENGTH)
  private String slug;

  @Column(nullable = false, length = CODE_MAX_LENGTH)
  private String code;

  @Column(nullable = false, length = TITLE_MAX_LENGTH)
  private String title;

  @Column(nullable = false, length = LANG_MAX_LENGTH)
  private String lang;

  @Column(name = "deactivated_at")
  private Instant deactivatedAt;

  protected ExperienceContractType() {
  }

  public ExperienceContractType(String slug, String code, String title, String lang) {
    this.slug = slug;
    this.code = code;
    this.title = title;
    this.lang = lang;
  }

  public String getSlug() {
    return slug;
  }

  public String getCode() {
    return code;
  }

  public String getTitle() {
    return title;
  }

  public String getLang() {
    return lang;
  }

  public Instant getDeactivatedAt() {
    return deactivatedAt;
  }

  public void markDeactivated() {
    this.deactivatedAt = Instant.now();
  }

  public void reactivate() {
    this.deactivatedAt = null;
  }

  public void updateDetails(String slug, String code, String title, String lang) {
    this.slug = slug;
    this.code = code;
    this.title = title;
    this.lang = lang;
  }
}
