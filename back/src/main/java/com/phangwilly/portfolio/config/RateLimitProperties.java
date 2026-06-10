package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

  public static final boolean DEFAULT_ENABLED = true;
  public static final int DEFAULT_ADMIN_REQUESTS_PER_SECOND = 100;
  public static final int DEFAULT_STANDARD_REQUESTS_PER_SECOND = 50;
  public static final long DEFAULT_BUCKET_TTL_MILLIS = 600_000L;
  public static final long DEFAULT_CLEANUP_INTERVAL_MILLIS = 300_000L;

  private boolean enabled = DEFAULT_ENABLED;
  private int adminRequestsPerSecond = DEFAULT_ADMIN_REQUESTS_PER_SECOND;
  private int standardRequestsPerSecond = DEFAULT_STANDARD_REQUESTS_PER_SECOND;
  private long bucketTtlMillis = DEFAULT_BUCKET_TTL_MILLIS;
  private long cleanupIntervalMillis = DEFAULT_CLEANUP_INTERVAL_MILLIS;

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public int getAdminRequestsPerSecond() {
    return adminRequestsPerSecond;
  }

  public void setAdminRequestsPerSecond(int adminRequestsPerSecond) {
    this.adminRequestsPerSecond = positiveOrDefault(
      adminRequestsPerSecond,
      DEFAULT_ADMIN_REQUESTS_PER_SECOND
    );
  }

  public int getStandardRequestsPerSecond() {
    return standardRequestsPerSecond;
  }

  public void setStandardRequestsPerSecond(int standardRequestsPerSecond) {
    this.standardRequestsPerSecond = positiveOrDefault(
      standardRequestsPerSecond,
      DEFAULT_STANDARD_REQUESTS_PER_SECOND
    );
  }

  public long getBucketTtlMillis() {
    return bucketTtlMillis;
  }

  public void setBucketTtlMillis(long bucketTtlMillis) {
    this.bucketTtlMillis = positiveOrDefault(bucketTtlMillis, DEFAULT_BUCKET_TTL_MILLIS);
  }

  public long getCleanupIntervalMillis() {
    return cleanupIntervalMillis;
  }

  public void setCleanupIntervalMillis(long cleanupIntervalMillis) {
    this.cleanupIntervalMillis = positiveOrDefault(
      cleanupIntervalMillis,
      DEFAULT_CLEANUP_INTERVAL_MILLIS
    );
  }

  private static int positiveOrDefault(int value, int defaultValue) {
    return value > 0 ? value : defaultValue;
  }

  private static long positiveOrDefault(long value, long defaultValue) {
    return value > 0 ? value : defaultValue;
  }
}
