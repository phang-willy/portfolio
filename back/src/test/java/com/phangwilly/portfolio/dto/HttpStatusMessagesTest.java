package com.phangwilly.portfolio.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class HttpStatusMessagesTest {

  @Test
  void returnsStandardReasonPhraseWhenMessageIsBlank() {
    assertThat(HttpStatusMessages.resolve(HttpStatus.OK, null)).isEqualTo("OK");
    assertThat(HttpStatusMessages.resolve(HttpStatus.BAD_REQUEST, "   ")).isEqualTo("Bad Request");
    assertThat(HttpStatusMessages.resolve(HttpStatus.UNAUTHORIZED, null)).isEqualTo("Unauthorized");
    assertThat(HttpStatusMessages.resolve(HttpStatus.TOO_MANY_REQUESTS, null))
      .isEqualTo("Too Many Requests");
  }

  @Test
  void keepsCustomMessageWhenProvided() {
    assertThat(HttpStatusMessages.resolve(HttpStatus.BAD_REQUEST, "Invalid request body"))
      .isEqualTo("Invalid request body");
  }
}
