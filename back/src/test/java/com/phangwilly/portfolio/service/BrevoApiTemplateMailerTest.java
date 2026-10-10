package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.config.BrevoProperties;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class BrevoApiTemplateMailerTest {

  private BrevoApiTemplateMailer mailer;

  @BeforeEach
  void setUp() {
    BrevoProperties properties = new BrevoProperties();
    properties.setApiKey("test-key");
    properties.setSenderEmail("sender@example.test");
    properties.setSenderName("Portfolio");
    properties.setContactTemplateId("5");
    mailer = new BrevoApiTemplateMailer(properties, JsonMapper.builder().build());
  }

  @Test
  void templateSendUsesTheStoredTemplateAndParams() {
    Map<String, Object> body = mailer.requestBody(
      new BrevoTemplatePayload(5, "Léa", Map.of("OBJECT", "Merci")),
      "lea@example.test",
      "ignored"
    );

    assertThat(body).containsEntry("templateId", 5);
    assertThat(body).containsKey("params");
    assertThat(body).doesNotContainKey("textContent");
  }

  @Test
  void plainTextSendReplaysTheStoredText() {
    Map<String, Object> body = mailer.requestBody(
      new BrevoTemplatePayload(0, "", Map.of(), "Le jeton expire demain."),
      "owner@example.test",
      "Rappel"
    );

    assertThat(body).containsEntry("subject", "Rappel");
    assertThat(body).containsEntry("textContent", "Le jeton expire demain.");
    assertThat(body).doesNotContainKey("templateId");
  }
}
