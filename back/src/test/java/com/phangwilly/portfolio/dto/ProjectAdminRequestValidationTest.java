package com.phangwilly.portfolio.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.List;
import org.junit.jupiter.api.Test;

class ProjectAdminRequestValidationTest {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void acceptsHttpAndEmptyProjectLinks() {
    assertThat(violations("https://phangwilly.com", "http://github.com/phang-willy/portfolio")).isZero();
    assertThat(violations("HTTPS://phangwilly.com/path", "")).isZero();
    assertThat(violations(null, null)).isZero();
  }

  @Test
  void rejectsLinksOutsideHttp() {
    assertThat(violations("javascript:alert(1)", "https://github.com/phang-willy/portfolio")).isPositive();
    assertThat(violations("https://phangwilly.com", "data:text/html,hi")).isPositive();
  }

  private int violations(String productionLink, String sourceCodeLink) {
    return validator.validate(request(productionLink, sourceCodeLink)).size();
  }

  private static ProjectAdminRequest request(String productionLink, String sourceCodeLink) {
    ProjectLocaleRequest locale = new ProjectLocaleRequest("Title", "Description", "", "Alt");
    return new ProjectAdminRequest(
      "geolock",
      new Localized<>(locale, locale),
      List.of(),
      productionLink,
      sourceCodeLink,
      null,
      null
    );
  }
}
