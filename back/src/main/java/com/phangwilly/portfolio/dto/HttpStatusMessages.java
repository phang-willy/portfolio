package com.phangwilly.portfolio.dto;

import org.springframework.http.HttpStatus;

/**
 * Default API messages aligned with standard HTTP reason phrases (RFC 9110).
 *
 * @see <a href="https://restfulapi.net/http-status-codes/">HTTP Status Codes</a>
 */
public final class HttpStatusMessages {

  private HttpStatusMessages() {
  }

  public static String defaultMessage(HttpStatus status) {
    return status.getReasonPhrase();
  }

  public static String resolve(HttpStatus status, String message) {
    if (message == null || message.isBlank()) {
      return defaultMessage(status);
    }

    return message;
  }
}
