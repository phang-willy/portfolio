package com.phangwilly.portfolio.security;

public final class Honeypot {

  public static final String FIELD_NAME = "website";

  private Honeypot() {
  }

  public static boolean isFilled(String value) {
    return value != null && !value.isBlank();
  }
}
