package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.config.RateLimitProperties;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class RateLimitKeyResolver {

  private static final Set<String> ADMIN_AUTHORITIES = Set.of("ROLE_ADMIN", "ADMIN");
  private static final String ADMIN_BUCKET_PREFIX = "admin";
  private static final String STANDARD_BUCKET_PREFIX = "standard";
  private static final String ANONYMOUS_BUCKET_PREFIX = "anonymous";
  private static final String UNKNOWN_CLIENT = "unknown-client";

  private final RateLimitProperties properties;

  public RateLimitKeyResolver(RateLimitProperties properties) {
    this.properties = properties;
  }

  public RateLimitKey resolve(HttpServletRequest request) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    boolean admin = hasAdminRole(authentication);
    int requestsPerSecond = admin
      ? properties.getAdminRequestsPerSecond()
      : properties.getStandardRequestsPerSecond();

    return new RateLimitKey(resolveBucketKey(request, authentication, admin), requestsPerSecond);
  }

  public boolean hasAdminRole(Authentication authentication) {
    if (!isAuthenticatedUser(authentication)) {
      return false;
    }

    return authentication
      .getAuthorities()
      .stream()
      .map(GrantedAuthority::getAuthority)
      .anyMatch(ADMIN_AUTHORITIES::contains);
  }

  private String resolveBucketKey(
    HttpServletRequest request,
    Authentication authentication,
    boolean admin
  ) {
    if (isAuthenticatedUser(authentication)) {
      String rolePrefix = admin ? ADMIN_BUCKET_PREFIX : STANDARD_BUCKET_PREFIX;
      return rolePrefix + ":user:" + authentication.getName();
    }

    return ANONYMOUS_BUCKET_PREFIX + ":ip:" + resolveClientIp(request);
  }

  private static boolean isAuthenticatedUser(Authentication authentication) {
    return authentication != null
      && authentication.isAuthenticated()
      && !(authentication instanceof AnonymousAuthenticationToken);
  }

  private static String resolveClientIp(HttpServletRequest request) {
    String remoteAddress = request.getRemoteAddr();
    return remoteAddress == null || remoteAddress.isBlank() ? UNKNOWN_CLIENT : remoteAddress;
  }
}
