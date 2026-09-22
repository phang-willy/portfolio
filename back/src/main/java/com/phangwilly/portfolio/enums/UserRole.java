package com.phangwilly.portfolio.enums;

public enum UserRole {
  SUPER_ADMIN,
  ADMIN,
  USER;

  public boolean canAccessAdmin() {
    return this == SUPER_ADMIN || this == ADMIN;
  }

  public boolean outranks(UserRole other) {
    return other != null && rank() > other.rank();
  }

  private int rank() {
    return switch (this) {
      case SUPER_ADMIN -> 3;
      case ADMIN -> 2;
      case USER -> 1;
    };
  }
}
