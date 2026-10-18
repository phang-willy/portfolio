package com.phangwilly.portfolio.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.phangwilly.portfolio.exception.RateLimitExceededException;
import com.phangwilly.portfolio.security.RateLimitKeyResolver;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitingInterceptorTest {

  @Test
  void throwsRateLimitExceededWhenBucketIsEmpty() {
    RateLimitProperties properties = new RateLimitProperties();
    properties.setStandardRequestsPerSecond(1);
    RateLimitingInterceptor interceptor = new RateLimitingInterceptor(
      properties,
      new RateLimitBucketRegistry(properties),
      new RateLimitKeyResolver(properties)
    );
    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/projects");
    request.setRemoteAddr("127.0.0.1");

    assertThat(interceptor.preHandle(request, new MockHttpServletResponse(), new Object())).isTrue();
    assertThatThrownBy(() -> interceptor.preHandle(
      request,
      new MockHttpServletResponse(),
      new Object()
    )).isInstanceOf(RateLimitExceededException.class);
  }
}
