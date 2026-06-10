package com.phangwilly.portfolio.config;

import com.phangwilly.portfolio.security.RateLimitKeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimitingConfig {

  @Bean
  public RateLimitBucketRegistry rateLimitBucketRegistry(RateLimitProperties properties) {
    return new RateLimitBucketRegistry(properties);
  }

  @Bean
  public RateLimitingInterceptor rateLimitingInterceptor(
    RateLimitProperties properties,
    RateLimitBucketRegistry bucketRegistry,
    RateLimitKeyResolver keyResolver
  ) {
    return new RateLimitingInterceptor(properties, bucketRegistry, keyResolver);
  }
}
