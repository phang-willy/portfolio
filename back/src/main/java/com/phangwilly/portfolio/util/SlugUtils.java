package com.phangwilly.portfolio.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtils {

  private SlugUtils() {
  }

  public static String slugify(String value) {
    if (value == null) {
      return "";
    }

    String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
      .replaceAll("\\p{M}+", "")
      .toLowerCase(Locale.ROOT)
      .trim()
      .replaceAll("[^a-z0-9]+", "-")
      .replaceAll("^-+|-+$", "");

    return normalized;
  }

  public static String slugify(String left, String right) {
    return slugify(left + "-" + right);
  }
}
