package com.phangwilly.portfolio.config;

import io.github.bucket4j.Bucket;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.scheduling.annotation.Scheduled;

public class RateLimitBucketRegistry {

  private static final Duration RATE_LIMIT_PERIOD = Duration.ofSeconds(1);

  private final RateLimitProperties properties;
  private final ConcurrentMap<String, CachedBucket> buckets = new ConcurrentHashMap<>();

  public RateLimitBucketRegistry(RateLimitProperties properties) {
    this.properties = properties;
  }

  public Bucket getBucket(String key, int requestsPerSecond) {
    long now = System.currentTimeMillis();

    CachedBucket cachedBucket = buckets.compute(key, (ignored, currentBucket) -> {
      if (currentBucket == null || currentBucket.requestsPerSecond() != requestsPerSecond) {
        return new CachedBucket(createBucket(requestsPerSecond), requestsPerSecond, now);
      }

      currentBucket.touch(now);
      return currentBucket;
    });

    return cachedBucket.bucket();
  }

  public int bucketCount() {
    return buckets.size();
  }

  @Scheduled(fixedDelayString = "${app.rate-limit.cleanup-interval-millis:300000}")
  public void removeIdleBuckets() {
    long expirationThreshold = System.currentTimeMillis() - properties.getBucketTtlMillis();
    buckets.entrySet().removeIf(entry -> entry.getValue().lastAccessEpochMillis() < expirationThreshold);
  }

  private Bucket createBucket(int requestsPerSecond) {
    return Bucket
      .builder()
      .addLimit(limit -> limit
        .capacity(requestsPerSecond)
        .refillGreedy(requestsPerSecond, RATE_LIMIT_PERIOD))
      .build();
  }

  private static final class CachedBucket {

    private final Bucket bucket;
    private final int requestsPerSecond;
    private volatile long lastAccessEpochMillis;

    private CachedBucket(Bucket bucket, int requestsPerSecond, long lastAccessEpochMillis) {
      this.bucket = bucket;
      this.requestsPerSecond = requestsPerSecond;
      this.lastAccessEpochMillis = lastAccessEpochMillis;
    }

    private Bucket bucket() {
      return bucket;
    }

    private int requestsPerSecond() {
      return requestsPerSecond;
    }

    private long lastAccessEpochMillis() {
      return lastAccessEpochMillis;
    }

    private void touch(long lastAccessEpochMillis) {
      this.lastAccessEpochMillis = lastAccessEpochMillis;
    }
  }
}
