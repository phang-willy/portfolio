package com.phangwilly.portfolio.exception;

public class RateLimitExceededException extends RuntimeException {

  private final long retryAfterSeconds;

  public RateLimitExceededException(long retryAfterSeconds) {
    super("Too many requests");
    this.retryAfterSeconds = retryAfterSeconds;
  }

  public long retryAfterSeconds() {
    return retryAfterSeconds;
  }
}
