package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "email_verification_token")
public class EmailVerificationToken extends UuidPrimaryKeyEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
    name = "user_id",
    nullable = false,
    foreignKey = @ForeignKey(name = "fk_email_verification_token_user")
  )
  private User user;

  @Column(name = "token_hash", nullable = false, unique = true, length = 128)
  private String tokenHash;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "expired_at", nullable = false)
  private Instant expiredAt;

  @Column(name = "consumed_at")
  private Instant consumedAt;

  protected EmailVerificationToken() {
  }

  public EmailVerificationToken(User user, String tokenHash, Instant expiredAt) {
    this.user = user;
    this.tokenHash = tokenHash;
    this.expiredAt = expiredAt;
  }

  public User getUser() {
    return user;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getExpiredAt() {
    return expiredAt;
  }

  public Instant getConsumedAt() {
    return consumedAt;
  }

  public boolean isUsable(Instant now) {
    return consumedAt == null && expiredAt.isAfter(now);
  }

  public void consume(Instant consumedAt) {
    this.consumedAt = consumedAt;
  }
}
