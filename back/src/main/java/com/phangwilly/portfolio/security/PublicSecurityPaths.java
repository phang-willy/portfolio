package com.phangwilly.portfolio.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;
import org.springframework.http.HttpMethod;
import org.springframework.util.AntPathMatcher;

public final class PublicSecurityPaths {

  public static final String AUTH_CONFIG_PATH = "/api/auth/config";
  public static final String AUTH_REGISTER_PATH = "/api/auth/register";
  public static final String AUTH_VERIFY_EMAIL_PATH = "/api/auth/verify-email";
  public static final String AUTH_LOGIN_PATH = "/api/auth/login";
  public static final String AUTH_VERIFY_TWO_FACTOR_PATH = "/api/auth/verify-2fa";
  public static final String AUTH_FORGOT_PASSWORD_PATH = "/api/auth/forgot-password";
  public static final String AUTH_RESET_PASSWORD_PATH = "/api/auth/reset-password";
  public static final String AUTH_ME_PATH = "/api/auth/me";
  public static final String AUTH_LOGOUT_PATH = "/api/auth/logout";
  public static final String AUTH_REFRESH_PATH = "/api/auth/refresh";
  public static final String HEALTH_PATH = "/api/health";
  public static final String PROJECT_PATH = "/api/project";
  public static final String ACTUATOR_PATTERN = "/actuator/**";
  public static final String ADMIN_FRONT_PATTERN = "/admin/**";

  private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
  private static final String[] PUBLIC_MATCHERS = {
    AUTH_CONFIG_PATH,
    AUTH_REGISTER_PATH,
    AUTH_VERIFY_EMAIL_PATH,
    AUTH_LOGIN_PATH,
    AUTH_VERIFY_TWO_FACTOR_PATH,
    AUTH_FORGOT_PASSWORD_PATH,
    AUTH_RESET_PASSWORD_PATH,
    AUTH_LOGOUT_PATH,
    AUTH_REFRESH_PATH,
    HEALTH_PATH,
    PROJECT_PATH,
    ACTUATOR_PATTERN,
    ADMIN_FRONT_PATTERN
  };

  private static final String[] AUTHENTICATED_MATCHERS = {
    AUTH_ME_PATH
  };

  private static final Set<String> PUBLIC_PATTERNS = Set.of(PUBLIC_MATCHERS);

  private PublicSecurityPaths() {
  }

  public static String[] requestMatchers() {
    return PUBLIC_MATCHERS.clone();
  }

  public static String[] authenticatedRequestMatchers() {
    return AUTHENTICATED_MATCHERS.clone();
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
