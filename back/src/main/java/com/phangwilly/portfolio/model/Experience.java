package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "experience")
public class Experience extends AuditableEntity {

  private static final int SLUG_MAX_LENGTH = 255;
  private static final int ROLE_MAX_LENGTH = 255;
  private static final int COMPANY_MAX_LENGTH = 255;
  private static final int SUMMARY_MAX_LENGTH = 500;
  private static final int LANG_MAX_LENGTH = 10;

  @Column(name = "group_id", nullable = false, updatable = false, columnDefinition = "uuid")
  private UUID groupId;

  @Column(nullable = false, length = SLUG_MAX_LENGTH)
  private String slug;

  @Column(name = "year_start", nullable = false)
  private Short yearStart;

  @Column(name = "year_end")
  private Short yearEnd;

  @Column(nullable = false, length = ROLE_MAX_LENGTH)
  private String role;

  @Column(nullable = false, length = COMPANY_MAX_LENGTH)
  private String company;

  @Column(length = SUMMARY_MAX_LENGTH)
  private String summary;

  @Column(columnDefinition = "text")
  private String content;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "id_experience_contract_type")
  private ExperienceContractType contractType;

  @Column(nullable = false, length = LANG_MAX_LENGTH)
  private String lang;

  @Column(name = "deactivated_at")
  private Instant deactivatedAt;

  protected Experience() {
  }

  public Experience(
    UUID groupId,
    String slug,
    Short yearStart,
    Short yearEnd,
    String role,
    String company,
    String summary,
    String content,
    ExperienceContractType contractType,
    String lang
  ) {
    this.groupId = groupId;
    this.slug = slug;
    this.yearStart = yearStart;
    this.yearEnd = yearEnd;
    this.role = role;
    this.company = company;
    this.summary = summary;
    this.content = content;
    this.contractType = contractType;
    this.lang = lang;
  }

  public UUID getGroupId() {
    return groupId;
  }

  public String getSlug() {
    return slug;
  }

  public Short getYearStart() {
    return yearStart;
  }

  public Short getYearEnd() {
    return yearEnd;
  }

  public String getRole() {
    return role;
  }

  public String getCompany() {
    return company;
  }

  public String getSummary() {
    return summary;
  }

  public String getContent() {
    return content;
  }

  public ExperienceContractType getContractType() {
    return contractType;
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

  public void updateDetails(
    String slug,
    Short yearStart,
    Short yearEnd,
    String role,
    String company,
    String summary,
    String content,
    ExperienceContractType contractType,
    String lang
  ) {
    this.slug = slug;
    this.yearStart = yearStart;
    this.yearEnd = yearEnd;
    this.role = role;
    this.company = company;
    this.summary = summary;
    this.content = content;
    this.contractType = contractType;
    this.lang = lang;
  }
}
