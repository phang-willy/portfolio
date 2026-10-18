package com.phangwilly.portfolio.service;

import java.util.Map;

/** Replay data stored with a Brevo queue row. Secrets stay in configuration. */
public record BrevoTemplatePayload(
  int templateId,
  String recipientName,
  Map<String, String> params,
  String textContent
) {

  public BrevoTemplatePayload(int templateId, String recipientName, Map<String, String> params) {
    this(templateId, recipientName, params, "");
  }

  public BrevoTemplatePayload {
    recipientName = recipientName == null ? "" : recipientName;
    params = params == null ? Map.of() : Map.copyOf(params);
    textContent = textContent == null ? "" : textContent;
  }

  public boolean plainText() {
    return !textContent.isBlank();
  }
}
