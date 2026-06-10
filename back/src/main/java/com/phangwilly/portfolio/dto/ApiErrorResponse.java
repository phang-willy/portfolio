package com.phangwilly.portfolio.dto;

public record ApiErrorResponse(ErrorBody error) {

  public static ApiErrorResponse of(String code, String message) {
    return new ApiErrorResponse(new ErrorBody(code, message));
  }

  public record ErrorBody(String code, String message) {
  }
}
