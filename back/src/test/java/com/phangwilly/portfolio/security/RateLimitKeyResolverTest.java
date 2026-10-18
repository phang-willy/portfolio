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
  void resolvesAdminLimitFromRoleSuperAdminAuthority() {
    try {
      properties.setAdminRequestsPerSecond(100);
      authenticate("super-admin-user", "ROLE_SUPER_ADMIN");

      RateLimitKey key = resolver.resolve(new MockHttpServletRequest());

      assertThat(key.bucketKey()).isEqualTo("admin:user:super-admin-user");
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
  void resolvesADedicatedContactLimitForThePublicSubmission() {
    properties.setContactRequestsPerSecond(1);
    properties.setStandardRequestsPerSecond(50);
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/contact");
    request.setRemoteAddr("203.0.113.8");

    RateLimitKey key = resolver.resolve(request);

    assertThat(key.bucketKey()).isEqualTo("contact:ip:203.0.113.8");
    assertThat(key.requestsPerSecond()).isEqualTo(1);
  }

  @Test
  void keysContactLimitByTheVisitorIpWhenTheProxyTokenMatches() {
    properties.setContactRequestsPerSecond(1);
    properties.setContactProxyToken("proxy-secret");
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/contact");
    request.setRemoteAddr("10.0.0.8");
    request.addHeader(RateLimitKeyResolver.PROXY_TOKEN_HEADER, "proxy-secret");
    request.addHeader(RateLimitKeyResolver.CLIENT_IP_HEADER, "203.0.113.9");

    RateLimitKey key = resolver.resolve(request);

    assertThat(key.bucketKey()).isEqualTo("contact:ip:203.0.113.9");
  }

  @Test
  void ignoresAVisitorIpHeaderWhenTheProxyTokenDoesNotMatch() {
    properties.setContactProxyToken("proxy-secret");
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/contact");
    request.setRemoteAddr("10.0.0.8");
    request.addHeader(RateLimitKeyResolver.PROXY_TOKEN_HEADER, "other-secret");
    request.addHeader(RateLimitKeyResolver.CLIENT_IP_HEADER, "203.0.113.9");

    RateLimitKey key = resolver.resolve(request);

    assertThat(key.bucketKey()).isEqualTo("contact:ip:10.0.0.8");
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
