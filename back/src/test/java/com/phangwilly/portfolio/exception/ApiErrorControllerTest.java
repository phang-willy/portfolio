package com.phangwilly.portfolio.exception;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.RequestDispatcher;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

class ApiErrorControllerTest {

  @Test
  void returnsApiEnvelopeFromErrorDispatchAttributes() {
    ApiErrorController controller = new ApiErrorController();
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setAttribute(RequestDispatcher.ERROR_STATUS_CODE, 404);

    var response = controller.handleError(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().success()).isFalse();
    assertThat(response.getBody().code()).isEqualTo(404);
    assertThat(response.getBody().message()).isEqualTo("Not Found");
    assertThat(response.getBody().data()).isNull();
  }
}
