package com.phangwilly.portfolio.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableScheduling
public class WebConfig implements WebMvcConfigurer {

  private static final String API_PATH_PATTERN = "/api/**";
  private static final String[] ALLOWED_METHODS = {
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  };
  private static final long CORS_MAX_AGE_SECONDS = 3_600L;

  private final CorsProperties corsProperties;
  private final RateLimitingInterceptor rateLimitingInterceptor;

  public WebConfig(CorsProperties corsProperties, RateLimitingInterceptor rateLimitingInterceptor) {
    this.corsProperties = corsProperties;
    this.rateLimitingInterceptor = rateLimitingInterceptor;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    if (corsProperties.allowedOrigins().isEmpty()) {
      return;
    }

    registry
      .addMapping(API_PATH_PATTERN)
      .allowedOrigins(corsProperties.allowedOrigins().toArray(String[]::new))
      .allowedMethods(ALLOWED_METHODS)
      .allowedHeaders("*")
      .maxAge(CORS_MAX_AGE_SECONDS);
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry
      .addInterceptor(rateLimitingInterceptor)
      .addPathPatterns(API_PATH_PATTERN);
  }
}
