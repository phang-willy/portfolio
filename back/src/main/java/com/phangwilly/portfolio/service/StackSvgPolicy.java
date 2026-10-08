package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.exception.ApiException;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;

/**
 * Stack logos are pasted inline SVG, stored as text, and rendered in the admin.
 * Project image uploads are a separate path and do not accept SVG.
 */
public final class StackSvgPolicy {

  private static final String INVALID_SVG_CODE = "INVALID_SVG";
  private static final String INVALID_SVG_MESSAGE = "Stack icon must be a static inline SVG";
  private static final Pattern SVG_TAG = Pattern.compile("<svg\\b", Pattern.CASE_INSENSITIVE);
  private static final Pattern DANGEROUS = Pattern.compile(
    "<\\s*/?\\s*(script|foreignobject|iframe|object|embed|link|meta|image|style)\\b"
      + "|javascript\\s*:"
      + "|data\\s*:\\s*text/html"
      + "|(?:^|[\\s/])on[a-z]+\\s*="
      + "|href\\s*=\\s*['\"]\\s*(?:https?:|//)"
      + "|url\\s*\\(\\s*(?!#)",
    Pattern.CASE_INSENSITIVE
  );

  private StackSvgPolicy() {
  }

  public static String normalize(String image) {
    if (image == null) {
      return null;
    }

    String trimmed = image.trim();
    if (trimmed.isEmpty()) {
      return null;
    }

    if (!SVG_TAG.matcher(trimmed).find() || DANGEROUS.matcher(trimmed).find()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_SVG_CODE, INVALID_SVG_MESSAGE);
    }

    return trimmed;
  }
}
