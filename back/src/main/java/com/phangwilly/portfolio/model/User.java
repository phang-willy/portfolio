package com.phangwilly.portfolio.model;

import com.phangwilly.portfolio.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "\"user\"")
public class User extends UuidPrimaryKeyEntity {

  private static final int NAME_MAX_LENGTH = 255;
  private static final int EMAIL_MAX_LENGTH = 320;
  private static final int ROLE_MAX_LENGTH = 20;

  @Column(nullable = false, length = NAME_MAX_LENGTH)
  private String lastname;

  @Column(nullable = false, length = NAME_MAX_LENGTH)
  private String firstname;

  @Column(nullable = false, unique = true, length = EMAIL_MAX_LENGTH)
  private String email;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = ROLE_MAX_LENGTH)
  private UserRole role = UserRole.USER;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "deactivated_at")
  private Instant deactivatedAt;

  @Column(name = "lock_until")
  private Instant lockUntil;

  @Column(name = "verified_at")
  private Instant verifiedAt;

  protected User() {
  }

  public User(String lastname, String firstname, String email) {
    this.lastname = lastname;
    this.firstname = firstname;
    this.email = email;
  }

  public String getLastname() {
    return lastname;
  }

  public String getFirstname() {
    return firstname;
  }

  public String getEmail() {
    return email;
  }

  public UserRole getRole() {
    return role;
  }

  public void changeRole(UserRole role) {
    this.role = role == null ? UserRole.USER : role;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public Instant getDeactivatedAt() {
    return deactivatedAt;
  }

  public Instant getLockUntil() {
    return lockUntil;
  }

  public Instant getVerifiedAt() {
    return verifiedAt;
  }

  public boolean isVerified() {
    return verifiedAt != null;
  }

  public boolean isActive() {
    return deactivatedAt == null;
  }

  public boolean isLocked(Instant now) {
    return lockUntil != null && lockUntil.isAfter(now);
  }

  public void verify(Instant verifiedAt) {
    this.verifiedAt = verifiedAt;
  }
}
