package com.phangwilly.portfolio.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PersonNameFormatterTest {

  @Test
  void uppercasesLastname() {
    assertThat(PersonNameFormatter.formatLastname("  dupont  ")).isEqualTo("DUPONT");
    assertThat(PersonNameFormatter.formatLastname("de la roche")).isEqualTo("DE LA ROCHE");
  }

  @Test
  void capitalizesSimpleFirstname() {
    assertThat(PersonNameFormatter.formatFirstname("willy")).isEqualTo("Willy");
    assertThat(PersonNameFormatter.formatFirstname(" ÉTIENNE ")).isEqualTo("Étienne");
  }

  @Test
  void capitalizesCompoundFirstnameWithSpacesAndHyphens() {
    assertThat(PersonNameFormatter.formatFirstname("jean pierre")).isEqualTo("Jean Pierre");
    assertThat(PersonNameFormatter.formatFirstname("jean-pierre")).isEqualTo("Jean-Pierre");
    assertThat(PersonNameFormatter.formatFirstname("anne marie-claire")).isEqualTo("Anne Marie-Claire");
  }
}
