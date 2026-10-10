package com.phangwilly.portfolio.dto;

import java.util.List;
import org.springframework.http.HttpStatus;

public record PaginatedApiResponse<T>(
  boolean success,
  int code,
  String message,
  List<T> data,
  PageResponse.Pagination pagination
) {

  public static <T> PaginatedApiResponse<T> success(
    HttpStatus status,
    String message,
    PageResponse<T> page
  ) {
    return new PaginatedApiResponse<>(
      true,
      status.value(),
      HttpStatusMessages.resolve(status, message),
      page.data(),
      page.pagination()
    );
  }
}
