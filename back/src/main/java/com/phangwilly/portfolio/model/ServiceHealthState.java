package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "service_health_state")
public class ServiceHealthState {

  @Id
  @Column(nullable = false, length = 64)
  private String code;

  @Column(nullable = false, length = 8)
  private String status;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected ServiceHealthState() {
  }

  public ServiceHealthState(String code, String status, Instant updatedAt) {
    this.code = code;
    this.status = status;
    this.updatedAt = updatedAt;
  }

  public String getCode() {
    return code;
  }

  public String getStatus() {
    return status;
  }

  public void update(String status, Instant updatedAt) {
    this.status = status;
    this.updatedAt = updatedAt;
  }
}
