package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.config.PaginationDefaults;
import com.phangwilly.portfolio.exception.InvalidPaginationParameterException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record PaginationRequest(int page, int size) {

  public static PaginationRequest of(Integer page, Integer size) {
    int resolvedPage = page == null ? PaginationDefaults.DEFAULT_PAGE : page;
    int requestedSize = size == null ? PaginationDefaults.DEFAULT_PAGE_SIZE : size;

    if (resolvedPage < 0) {
      throw new InvalidPaginationParameterException("page must be greater than or equal to 0");
    }

    if (requestedSize < 1) {
      throw new InvalidPaginationParameterException("size must be greater than or equal to 1");
    }

    int resolvedSize = Math.min(requestedSize, PaginationDefaults.MAX_PAGE_SIZE);
    return new PaginationRequest(resolvedPage, resolvedSize);
  }

  public Pageable toPageable(Sort sort) {
    return PageRequest.of(page, size, sort);
  }
}
