package com.phangwilly.portfolio.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

class GlobalExceptionHandlerNotFoundTest {

  @Test
  void returnsApiEnvelopeForMissingResource() {
    GlobalExceptionHandler handler = new GlobalExceptionHandler();
    NoResourceFoundException exception = new NoResourceFoundException(
      org.springframework.http.HttpMethod.GET,
      "/api/auth/",
      "/api/auth/"
    );

    var response = handler.handleNoResourceFoundException(
      exception,
      new org.springframework.http.HttpHeaders(),
      HttpStatus.NOT_FOUND,
      new ServletWebRequest(new MockHttpServletRequest())
    );

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(response.getBody()).isInstanceOf(com.phangwilly.portfolio.dto.ApiResponse.class);

    var body = (com.phangwilly.portfolio.dto.ApiResponse<?>) response.getBody();
    assertThat(body.success()).isFalse();
    assertThat(body.code()).isEqualTo(404);
    assertThat(body.message()).isEqualTo("Not Found");
    assertThat(body.data()).isNull();
  }
}
