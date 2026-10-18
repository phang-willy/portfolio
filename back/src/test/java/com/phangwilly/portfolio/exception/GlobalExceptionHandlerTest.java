package com.phangwilly.portfolio.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class GlobalExceptionHandlerTest {

  @Test
  void returnsJsonErrorForRateLimitExceeded() {
    GlobalExceptionHandler handler = new GlobalExceptionHandler();

    var response = handler.handleRateLimitExceeded(new RateLimitExceededException(1L));

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().success()).isFalse();
    assertThat(response.getBody().code()).isEqualTo(429);
    assertThat(response.getBody().message()).isEqualTo("Too Many Requests");
    assertThat(response.getBody().data()).isNull();
    assertThat(response.getHeaders().getFirst("Retry-After")).isEqualTo("1");
  }
}
