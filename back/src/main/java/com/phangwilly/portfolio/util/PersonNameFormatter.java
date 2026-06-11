package com.phangwilly.portfolio.util;

import java.util.Locale;

public final class PersonNameFormatter {

  private static final Locale LOCALE = Locale.FRENCH;

  private PersonNameFormatter() {
  }

  public static String formatLastname(String lastname) {
    return lastname.trim().toUpperCase(LOCALE);
  }

  public static String formatFirstname(String firstname) {
    String trimmed = firstname.trim();
    if (trimmed.isEmpty()) {
      return trimmed;
    }

    String[] words = trimmed.split("\\s+");
    StringBuilder result = new StringBuilder();

    for (int wordIndex = 0; wordIndex < words.length; wordIndex++) {
      if (wordIndex > 0) {
        result.append(' ');
      }

      appendCompoundName(result, words[wordIndex]);
    }

    return result.toString();
  }

  private static void appendCompoundName(StringBuilder result, String word) {
    String[] parts = word.split("-", -1);

    for (int partIndex = 0; partIndex < parts.length; partIndex++) {
      if (partIndex > 0) {
        result.append('-');
      }

      result.append(capitalize(parts[partIndex]));
    }
  }

  private static String capitalize(String value) {
    if (value.isEmpty()) {
      return value;
    }

    return value.substring(0, 1).toUpperCase(LOCALE)
      + value.substring(1).toLowerCase(LOCALE);
  }
}
