package com.phangwilly.portfolio.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class HoneypotTest {

  @Test
  void detectsFilledHoneypotValues() {
    assertThat(Honeypot.isFilled(null)).isFalse();
    assertThat(Honeypot.isFilled("")).isFalse();
    assertThat(Honeypot.isFilled("   ")).isFalse();
    assertThat(Honeypot.isFilled("https://spam.example")).isTrue();
  }
}
