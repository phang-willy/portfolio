package com.phangwilly.portfolio.config;

import com.phangwilly.portfolio.exception.RateLimitExceededException;
import com.phangwilly.portfolio.security.RateLimitKey;
import com.phangwilly.portfolio.security.RateLimitKeyResolver;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.concurrent.TimeUnit;
import org.springframework.web.cors.CorsUtils;
import org.springframework.web.servlet.HandlerInterceptor;

public class RateLimitingInterceptor implements HandlerInterceptor {

  private static final long TOKEN_COST_PER_REQUEST = 1L;
  private static final String RATE_LIMIT_LIMIT_HEADER = "X-Rate-Limit-Limit";
  private static final String RATE_LIMIT_REMAINING_HEADER = "X-Rate-Limit-Remaining";

  private final RateLimitProperties properties;
  private final RateLimitBucketRegistry bucketRegistry;
  private final RateLimitKeyResolver keyResolver;

  public RateLimitingInterceptor(
    RateLimitProperties properties,
    RateLimitBucketRegistry bucketRegistry,
    RateLimitKeyResolver keyResolver
  ) {
    this.properties = properties;
    this.bucketRegistry = bucketRegistry;
    this.keyResolver = keyResolver;
  }

  @Override
  public boolean preHandle(
    HttpServletRequest request,
    HttpServletResponse response,
    Object handler
  ) {
    if (!properties.isEnabled() || CorsUtils.isPreFlightRequest(request)) {
      return true;
    }

    RateLimitKey rateLimitKey = keyResolver.resolve(request);
    Bucket bucket = bucketRegistry.getBucket(
      rateLimitKey.bucketKey(),
      rateLimitKey.requestsPerSecond()
    );
    ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(TOKEN_COST_PER_REQUEST);

    response.setHeader(RATE_LIMIT_LIMIT_HEADER, String.valueOf(rateLimitKey.requestsPerSecond()));
    response.setHeader(RATE_LIMIT_REMAINING_HEADER, String.valueOf(probe.getRemainingTokens()));

    if (!probe.isConsumed()) {
      throw new RateLimitExceededException(resolveRetryAfterSeconds(probe));
    }

    return true;
  }

  private static long resolveRetryAfterSeconds(ConsumptionProbe probe) {
    return Math.max(1L, TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()));
  }
}
