package com.phangwilly.portfolio.dto;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public final class ApiResponses {

  private ApiResponses() {
  }

  public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
    return ResponseEntity.status(HttpStatus.OK)
      .body(ApiResponse.success(HttpStatus.OK, null, data));
  }

  public static ResponseEntity<ApiResponse<Void>> ok() {
    return ResponseEntity.status(HttpStatus.OK)
      .body(ApiResponse.success(HttpStatus.OK, null, null));
  }

  public static ResponseEntity<ApiResponse<Void>> okMessage(String message) {
    return ResponseEntity.status(HttpStatus.OK)
      .body(ApiResponse.success(HttpStatus.OK, message, null));
  }
}
