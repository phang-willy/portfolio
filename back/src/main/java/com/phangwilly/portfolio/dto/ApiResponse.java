package com.phangwilly.portfolio.dto;

import org.springframework.http.HttpStatus;

public record ApiResponse<T>(boolean success, int code, String message, T data) {

  public static <T> ApiResponse<T> success(HttpStatus status, String message, T data) {
    return new ApiResponse<>(true, status.value(), HttpStatusMessages.resolve(status, message), data);
  }

  public static <T> ApiResponse<T> error(HttpStatus status, String message) {
    return new ApiResponse<>(false, status.value(), HttpStatusMessages.resolve(status, message), null);
  }
}
