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
@Table(name = "two_factor_auth")
public class TwoFactorAuth extends UuidPrimaryKeyEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
    name = "user_id",
    nullable = false,
    foreignKey = @ForeignKey(name = "fk_two_factor_auth_user")
  )
  private User user;

  @Column(name = "code_hash", nullable = false, length = 128)
  private String codeHash;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "verified_at")
  private Instant verifiedAt;

  @Column(name = "expired_at", nullable = false)
  private Instant expiredAt;

  protected TwoFactorAuth() {
  }

  public TwoFactorAuth(User user, String codeHash, Instant expiredAt) {
    this.user = user;
    this.codeHash = codeHash;
    this.expiredAt = expiredAt;
  }

  public User getUser() {
    return user;
  }

  public String getCodeHash() {
    return codeHash;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getVerifiedAt() {
    return verifiedAt;
  }

  public Instant getExpiredAt() {
    return expiredAt;
  }

  public boolean isUsable(Instant now) {
    return verifiedAt == null && expiredAt.isAfter(now);
  }

  public void verify(Instant verifiedAt) {
    this.verifiedAt = verifiedAt;
  }
}
