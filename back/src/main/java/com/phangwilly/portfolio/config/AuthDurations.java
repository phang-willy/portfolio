package com.phangwilly.portfolio.config;

import java.time.Duration;

public final class AuthDurations {

  public static final Duration EMAIL_VERIFICATION_TOKEN_TTL = Duration.ofMinutes(60);
  public static final Duration FORGOT_PASSWORD_TOKEN_TTL = Duration.ofMinutes(60);
  public static final Duration TWO_FACTOR_CODE_TTL = Duration.ofMinutes(10);
  public static final Duration DEFAULT_SESSION_TTL = Duration.ofHours(5);
  public static final Duration REMEMBER_ME_SESSION_TTL = Duration.ofDays(30);

  private AuthDurations() {
  }
}
