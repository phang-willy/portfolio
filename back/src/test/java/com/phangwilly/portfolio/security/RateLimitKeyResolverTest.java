package com.phangwilly.portfolio.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.config.RateLimitProperties;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class RateLimitKeyResolverTest {

  private final RateLimitProperties properties = new RateLimitProperties();
  private final RateLimitKeyResolver resolver = new RateLimitKeyResolver(properties);

  @Test
  void resolvesAdminLimitFromRoleAdminAuthority() {
    try {
      properties.setAdminRequestsPerSecond(100);
      authenticate("admin-user", "ROLE_ADMIN");

      RateLimitKey key = resolver.resolve(new MockHttpServletRequest());

      assertThat(key.bucketKey()).isEqualTo("admin:user:admin-user");
      assertThat(key.requestsPerSecond()).isEqualTo(100);
    } finally {
      SecurityContextHolder.clearContext();
    }
  }

  @Test
  void resolvesStandardLimitForAuthenticatedNonAdminUser() {
    try {
      properties.setStandardRequestsPerSecond(50);
      authenticate("standard-user", "ROLE_USER");

      RateLimitKey key = resolver.resolve(new MockHttpServletRequest());

      assertThat(key.bucketKey()).isEqualTo("standard:user:standard-user");
      assertThat(key.requestsPerSecond()).isEqualTo(50);
    } finally {
      SecurityContextHolder.clearContext();
    }
  }

  @Test
  void resolvesAnonymousLimitFromRemoteAddress() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr("127.0.0.1");

    RateLimitKey key = resolver.resolve(request);

    assertThat(key.bucketKey()).isEqualTo("anonymous:ip:127.0.0.1");
    assertThat(key.requestsPerSecond()).isEqualTo(50);
  }

  private static void authenticate(String username, String authority) {
    SecurityContextHolder
      .getContext()
      .setAuthentication(new UsernamePasswordAuthenticationToken(
        username,
        "password",
        List.of(new SimpleGrantedAuthority(authority))
      ));
  }
}
