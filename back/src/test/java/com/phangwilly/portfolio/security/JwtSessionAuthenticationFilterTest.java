package com.phangwilly.portfolio.security;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class JwtSessionAuthenticationFilterTest {

  @Test
  void skipsPublicAuthEndpointsEvenWhenBearerTokenIsStale() throws Exception {
    Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    JwtSessionAuthenticationFilter filter = new JwtSessionAuthenticationFilter(
      null,
      null,
      null,
      null,
      null,
      clock
    );
    MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
    request.addHeader("Authorization", "Bearer stale-token");
    MockHttpServletResponse response = new MockHttpServletResponse();
    RecordingFilterChain filterChain = new RecordingFilterChain();

    filter.doFilter(request, response, filterChain);

    assertThat(filterChain.called()).isTrue();
    assertThat(response.getStatus()).isEqualTo(200);
  }

  private static final class RecordingFilterChain implements FilterChain {

    private boolean called;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response) {
      called = true;
    }

    private boolean called() {
      return called;
    }
  }
}
