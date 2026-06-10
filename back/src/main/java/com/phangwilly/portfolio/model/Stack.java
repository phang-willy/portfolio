package com.phangwilly.portfolio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "stack")
public class Stack extends AuditableEntity {

  private static final int NAME_MAX_LENGTH = 255;

  @Column(nullable = false, length = NAME_MAX_LENGTH)
  private String name;

  @Column(columnDefinition = "text")
  private String image;

  protected Stack() {
  }

  public Stack(String name, String image) {
    this.name = name;
    this.image = image;
  }

  public String getName() {
    return name;
  }

  public String getImage() {
    return image;
  }
}
