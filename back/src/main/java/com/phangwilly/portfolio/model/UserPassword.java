package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "password")
public class UserPassword extends UuidPrimaryKeyEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(
    name = "user_id",
    nullable = false,
    foreignKey = @ForeignKey(name = "fk_password_user")
  )
  private User user;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected UserPassword() {
  }

  public UserPassword(User user, String passwordHash) {
    this.user = user;
    this.passwordHash = passwordHash;
  }

  public User getUser() {
    return user;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void updatePasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }
}
