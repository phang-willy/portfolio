package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "forgot_password")
public class ForgotPassword extends UuidPrimaryKeyEntity {

  private static final int EMAIL_MAX_LENGTH = 320;

  @Column(nullable = false, length = EMAIL_MAX_LENGTH)
  private String email;

  @Column(name = "token_hash", nullable = false, unique = true, length = 128)
  private String tokenHash;

  @Column(name = "expired_at", nullable = false)
  private Instant expiredAt;

  @Column(name = "consumed_at")
  private Instant consumedAt;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ForgotPassword() {
  }

  public ForgotPassword(String email, String tokenHash, Instant expiredAt) {
    this.email = email;
    this.tokenHash = tokenHash;
    this.expiredAt = expiredAt;
  }

  public String getEmail() {
    return email;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public Instant getExpiredAt() {
    return expiredAt;
  }

  public Instant getConsumedAt() {
    return consumedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public boolean isUsable(Instant now) {
    return consumedAt == null && expiredAt.isAfter(now);
  }

  public void consume(Instant consumedAt) {
    this.consumedAt = consumedAt;
  }
}
