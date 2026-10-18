package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

@MappedSuperclass
public abstract class UuidPrimaryKeyEntity {

  @Id
  @GeneratedValue
  @UuidGenerator(style = UuidGenerator.Style.VERSION_7)
  @Column(nullable = false, updatable = false, columnDefinition = "uuid")
  private UUID id;

  public UUID getId() {
    return id;
  }
}
