package com.phangwilly.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;
import org.springframework.http.HttpMethod;
import org.springframework.util.AntPathMatcher;

public final class PublicSecurityPaths {

  public static final String AUTH_PATTERN = "/api/auth/**";
  public static final String HEALTH_PATH = "/api/health";
  public static final String PROJECT_PATH = "/api/project";
  public static final String ACTUATOR_PATTERN = "/actuator/**";
  public static final String ADMIN_FRONT_PATTERN = "/admin/**";

  private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
  private static final Set<String> PUBLIC_PATTERNS = Set.of(
    AUTH_PATTERN,
    HEALTH_PATH,
    ACTUATOR_PATTERN,
    ADMIN_FRONT_PATTERN
  );

  private PublicSecurityPaths() {
  }

  public static String[] requestMatchers() {
    return new String[] {
      AUTH_PATTERN,
      HEALTH_PATH,
      PROJECT_PATH,
      ACTUATOR_PATTERN,
      ADMIN_FRONT_PATTERN
    };
  }

  public static boolean shouldSkipJwtFilter(HttpServletRequest request) {
    String path = request.getRequestURI();
    return PUBLIC_PATTERNS
      .stream()
      .anyMatch(pattern -> PATH_MATCHER.match(pattern, path))
      || isPublicProjectListRequest(request, path);
  }

  private static boolean isPublicProjectListRequest(HttpServletRequest request, String path) {
    return PROJECT_PATH.equals(path) && HttpMethod.GET.matches(request.getMethod());
  }
}
