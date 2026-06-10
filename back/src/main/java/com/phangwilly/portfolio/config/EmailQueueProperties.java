package com.phangwilly.portfolio.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.email-queue")
public class EmailQueueProperties {

  public static final int DEFAULT_MAX_ATTEMPTS = 3;
  public static final int DEFAULT_BATCH_SIZE = 10;
  private static final Duration DEFAULT_RETRY_DELAY = Duration.ofMinutes(5);

  private int maxAttempts = DEFAULT_MAX_ATTEMPTS;
  private int batchSize = DEFAULT_BATCH_SIZE;
  private Duration retryDelay = DEFAULT_RETRY_DELAY;

  public int getMaxAttempts() {
    return maxAttempts;
  }

  public void setMaxAttempts(int maxAttempts) {
    this.maxAttempts = maxAttempts > 0 ? maxAttempts : DEFAULT_MAX_ATTEMPTS;
  }

  public int getBatchSize() {
    return batchSize;
  }

  public void setBatchSize(int batchSize) {
    this.batchSize = batchSize > 0 ? batchSize : DEFAULT_BATCH_SIZE;
  }

  public Duration getRetryDelay() {
    return retryDelay;
  }

  public void setRetryDelay(Duration retryDelay) {
    this.retryDelay = retryDelay == null || retryDelay.isNegative() || retryDelay.isZero()
      ? DEFAULT_RETRY_DELAY
      : retryDelay;
  }
}
