package com.phangwilly.portfolio.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public contact form. Administrative fields are intentionally absent:
 * status, timestamps, history and email delivery stay under backend control.
 * Unknown JSON properties are ignored by Jackson.
 */
public record ContactRequest(
  @NotBlank @Size(max = FIRST_NAME_MAX) String firstName,
  @NotBlank @Size(max = LAST_NAME_MAX) String lastName,
  @NotBlank @Email @Size(max = EMAIL_MAX) String email,
  @NotBlank @Size(max = PHONE_MAX) @Pattern(regexp = PHONE_PATTERN) String phone,
  @Size(max = COMPANY_MAX) String company,
  @NotBlank @Size(max = TITLE_MAX) String title,
  @NotBlank @Size(max = MESSAGE_MAX) String message,
  @Size(max = WEBSITE_MAX) String website,
  Map<String, String> brevoParams
) {

  public static final int FIRST_NAME_MAX = 100;
  public static final int LAST_NAME_MAX = 100;
  public static final int EMAIL_MAX = 320;
  public static final int PHONE_MAX = 40;
  public static final int COMPANY_MAX = 200;
  public static final int TITLE_MAX = 200;
  public static final int MESSAGE_MAX = 10_000;
  public static final int WEBSITE_MAX = 500;
  public static final int BREVO_PARAM_MAX = 80;
  public static final int BREVO_KEY_MAX = 80;
  public static final String PHONE_PATTERN = "^[\\d\\s+().\\-/]+$";
  private static final java.util.regex.Pattern BREVO_KEY = java.util.regex.Pattern.compile("[A-Za-z0-9_]+");

  public ContactRequest(
    String firstName, String lastName, String email, String phone,
    String company, String title, String message, String website
  ) {
    this(firstName, lastName, email, phone, company, title, message, website, Map.of());
  }

  public ContactRequest {
    firstName = trimToEmpty(firstName);
    lastName = trimToEmpty(lastName);
    email = trimToEmpty(email);
    phone = trimToEmpty(phone);
    company = trimToNull(company);
    title = trimToEmpty(title);
    message = trimToEmpty(message);
    website = website == null ? null : website.trim();
    brevoParams = copyParams(brevoParams);
  }

  private static String trimToEmpty(String value) {
    return value == null ? "" : value.trim();
  }

  private static Map<String, String> copyParams(Map<String, String> source) {
    if (source == null || source.isEmpty()) {
      return Map.of();
    }
    Map<String, String> copy = new LinkedHashMap<>();
    for (Map.Entry<String, String> entry : source.entrySet()) {
      if (copy.size() >= BREVO_PARAM_MAX) {
        break;
      }
      String key = entry.getKey();
      String value = entry.getValue();
      if (key == null || value == null) {
        continue;
      }
      String trimmedKey = key.trim();
      if (trimmedKey.isEmpty() || trimmedKey.length() > BREVO_KEY_MAX || !BREVO_KEY.matcher(trimmedKey).matches()) {
        continue;
      }
      copy.put(trimmedKey, value.length() > MESSAGE_MAX ? value.substring(0, MESSAGE_MAX) : value);
    }
    return Map.copyOf(copy);
  }

  private static String trimToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
