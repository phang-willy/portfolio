package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "notification")
public class Notification extends UuidPrimaryKeyEntity {

  private static final int CODE_MAX_LENGTH = 64;
  private static final int TITLE_MAX_LENGTH = 255;

  @Column(name = "service_code", nullable = false, length = CODE_MAX_LENGTH)
  private String serviceCode;

  @Column(nullable = false, length = TITLE_MAX_LENGTH)
  private String title;

  @Column(nullable = false, columnDefinition = "text")
  private String message;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected Notification() {
  }

  public Notification(String serviceCode, String title, String message, Instant createdAt) {
    this.serviceCode = serviceCode;
    this.title = title;
    this.message = message;
    this.createdAt = createdAt;
  }

  public String getServiceCode() {
    return serviceCode;
  }

  public String getTitle() {
    return title;
  }

  public String getMessage() {
    return message;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
