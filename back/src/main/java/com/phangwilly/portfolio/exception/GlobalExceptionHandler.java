package com.phangwilly.portfolio.exception;

import com.phangwilly.portfolio.dto.ApiErrorResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final String RATE_LIMIT_EXCEEDED_CODE = "RATE_LIMIT_EXCEEDED";
  private static final String RATE_LIMIT_EXCEEDED_MESSAGE = "Too many requests";
  private static final String INVALID_PAGINATION_CODE = "INVALID_PAGINATION_PARAMETER";
  private static final String INVALID_PARAMETER_CODE = "INVALID_REQUEST_PARAMETER";
  private static final String INVALID_PARAMETER_MESSAGE = "Invalid request parameter";
  private static final String VALIDATION_FAILED_CODE = "VALIDATION_FAILED";
  private static final String VALIDATION_FAILED_MESSAGE = "Invalid request body";
  private static final String RETRY_AFTER_HEADER = "Retry-After";
  private static final String RATE_LIMIT_RETRY_AFTER_HEADER =
    "X-Rate-Limit-Retry-After-Seconds";

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception) {
    return ResponseEntity
      .status(exception.status())
      .body(ApiErrorResponse.of(exception.code(), exception.getMessage()));
  }

  @ExceptionHandler(RateLimitExceededException.class)
  public ResponseEntity<ApiErrorResponse> handleRateLimitExceeded(
    RateLimitExceededException exception
  ) {
    HttpHeaders headers = new HttpHeaders();
    String retryAfterSeconds = String.valueOf(exception.retryAfterSeconds());
    headers.set(RETRY_AFTER_HEADER, retryAfterSeconds);
    headers.set(RATE_LIMIT_RETRY_AFTER_HEADER, retryAfterSeconds);

    return ResponseEntity
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .headers(headers)
      .body(ApiErrorResponse.of(RATE_LIMIT_EXCEEDED_CODE, RATE_LIMIT_EXCEEDED_MESSAGE));
  }

  @ExceptionHandler(InvalidPaginationParameterException.class)
  public ResponseEntity<ApiErrorResponse> handleInvalidPaginationParameter(
    InvalidPaginationParameterException exception
  ) {
    return ResponseEntity
      .badRequest()
      .body(ApiErrorResponse.of(INVALID_PAGINATION_CODE, exception.getMessage()));
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ApiErrorResponse> handleArgumentTypeMismatch() {
    return ResponseEntity
      .badRequest()
      .body(ApiErrorResponse.of(INVALID_PARAMETER_CODE, INVALID_PARAMETER_MESSAGE));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidationFailed() {
    return ResponseEntity
      .badRequest()
      .body(ApiErrorResponse.of(VALIDATION_FAILED_CODE, VALIDATION_FAILED_MESSAGE));
  }
}
