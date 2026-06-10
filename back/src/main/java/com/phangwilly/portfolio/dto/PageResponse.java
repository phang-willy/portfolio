package com.phangwilly.portfolio.dto;

import java.util.List;
import org.springframework.data.domain.Page;

public record PageResponse<T>(List<T> data, Pagination pagination) {

  public static <T> PageResponse<T> from(Page<T> page) {
    return new PageResponse<>(
      page.getContent(),
      new Pagination(
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages()
      )
    );
  }

  public record Pagination(int page, int size, long totalItems, int totalPages) {
  }
}
