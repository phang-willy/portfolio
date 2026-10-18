package com.phangwilly.portfolio.dto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.phangwilly.portfolio.exception.InvalidPaginationParameterException;
import org.junit.jupiter.api.Test;

class PaginationRequestTest {

  @Test
  void usesDefaultPaginationWhenQueryParamsAreMissing() {
    PaginationRequest paginationRequest = PaginationRequest.of(null, null);

    assertThat(paginationRequest.page()).isZero();
    assertThat(paginationRequest.size()).isEqualTo(50);
  }

  @Test
  void limitsPageSizeToMaximumPageSize() {
    PaginationRequest paginationRequest = PaginationRequest.of(2, 200);

    assertThat(paginationRequest.page()).isEqualTo(2);
    assertThat(paginationRequest.size()).isEqualTo(200);
  }

  @Test
  void capsPageSizeAboveMaximum() {
    PaginationRequest paginationRequest = PaginationRequest.of(0, 500);

    assertThat(paginationRequest.size()).isEqualTo(200);
  }

  @Test
  void rejectsNegativePage() {
    assertThatThrownBy(() -> PaginationRequest.of(-1, 50))
      .isInstanceOf(InvalidPaginationParameterException.class)
      .hasMessage("page must be greater than or equal to 0");
  }

  @Test
  void rejectsZeroSize() {
    assertThatThrownBy(() -> PaginationRequest.of(0, 0))
      .isInstanceOf(InvalidPaginationParameterException.class)
      .hasMessage("size must be greater than or equal to 1");
  }
}
