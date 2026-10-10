package com.phangwilly.portfolio.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class PublicSecurityPathsTest {

  @Test
  void publicContactPostSkipsJwtWhileAdminContactStaysProtected() {
    MockHttpServletRequest contact = new MockHttpServletRequest("POST", "/api/contact");
    MockHttpServletRequest admin = new MockHttpServletRequest("GET", "/api/admin/contact");
    MockHttpServletRequest reply = new MockHttpServletRequest("POST", "/api/admin/contact/id/reply");

    MockHttpServletRequest stats = new MockHttpServletRequest("GET", "/api/github-stats");

    MockHttpServletRequest error = new MockHttpServletRequest("GET", "/error");
    MockHttpServletRequest unknown = new MockHttpServletRequest("GET", "/api/internal");

    assertThat(PublicSecurityPaths.shouldSkipJwtFilter(contact)).isTrue();
    assertThat(PublicSecurityPaths.shouldSkipJwtFilter(stats)).isTrue();
    assertThat(PublicSecurityPaths.shouldSkipJwtFilter(error)).isTrue();
    assertThat(PublicSecurityPaths.shouldSkipJwtFilter(admin)).isFalse();
    assertThat(PublicSecurityPaths.shouldSkipJwtFilter(reply)).isFalse();
    assertThat(PublicSecurityPaths.shouldSkipJwtFilter(unknown)).isFalse();
    assertThat(PublicSecurityPaths.requestMatchers()).contains("/error");
  }
}
