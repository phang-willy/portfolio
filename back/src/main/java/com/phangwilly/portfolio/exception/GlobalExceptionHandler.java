package com.phangwilly.portfolio.exception;

import com.phangwilly.portfolio.dto.ApiResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.beans.TypeMismatchException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  private static final String RETRY_AFTER_HEADER = "Retry-After";
  private static final String RATE_LIMIT_RETRY_AFTER_HEADER =
    "X-Rate-Limit-Retry-After-Seconds";

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException exception) {
    return ResponseEntity
      .status(exception.status())
      .body(ApiResponse.error(exception.status(), exception.getMessage()));
  }

  @ExceptionHandler(RateLimitExceededException.class)
  public ResponseEntity<ApiResponse<Void>> handleRateLimitExceeded(
    RateLimitExceededException exception
  ) {
    HttpHeaders headers = new HttpHeaders();
    String retryAfterSeconds = String.valueOf(exception.retryAfterSeconds());
    headers.set(RETRY_AFTER_HEADER, retryAfterSeconds);
    headers.set(RATE_LIMIT_RETRY_AFTER_HEADER, retryAfterSeconds);

    return ResponseEntity
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .headers(headers)
      .body(ApiResponse.error(HttpStatus.TOO_MANY_REQUESTS, null));
  }

  @ExceptionHandler(InvalidPaginationParameterException.class)
  public ResponseEntity<ApiResponse<Void>> handleInvalidPaginationParameter(
    InvalidPaginationParameterException exception
  ) {
    return ResponseEntity
      .badRequest()
      .body(ApiResponse.error(HttpStatus.BAD_REQUEST, exception.getMessage()));
  }

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
    MethodArgumentNotValidException exception,
    HttpHeaders headers,
    HttpStatusCode status,
    WebRequest request
  ) {
    return apiError(HttpStatus.BAD_REQUEST);
  }

  @Override
  protected ResponseEntity<Object> handleTypeMismatch(
    TypeMismatchException exception,
    HttpHeaders headers,
    HttpStatusCode status,
    WebRequest request
  ) {
    return apiError(HttpStatus.BAD_REQUEST);
  }

  @Override
  protected ResponseEntity<Object> handleNoResourceFoundException(
    NoResourceFoundException exception,
    HttpHeaders headers,
    HttpStatusCode status,
    WebRequest request
  ) {
    return apiError(HttpStatus.NOT_FOUND);
  }

  @Override
  protected ResponseEntity<Object> handleNoHandlerFoundException(
    NoHandlerFoundException exception,
    HttpHeaders headers,
    HttpStatusCode status,
    WebRequest request
  ) {
    return apiError(HttpStatus.NOT_FOUND);
  }

  @Override
  protected ResponseEntity<Object> handleHttpRequestMethodNotSupported(
    HttpRequestMethodNotSupportedException exception,
    HttpHeaders headers,
    HttpStatusCode status,
    WebRequest request
  ) {
    return apiError(HttpStatus.METHOD_NOT_ALLOWED);
  }

  private ResponseEntity<Object> apiError(HttpStatus status) {
    return ResponseEntity.status(status).body(ApiResponse.error(status, null));
  }
}
