package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.BrevoProperties;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class BrevoApiTemplateMailer implements BrevoTemplateMailer {

  private static final Duration TIMEOUT = Duration.ofSeconds(10);

  private final BrevoProperties properties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(TIMEOUT).build();

  public BrevoApiTemplateMailer(BrevoProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  @Override
  public void send(BrevoTemplatePayload payload, String recipientEmail, String subject) {
    if (properties.getApiKey().isEmpty() || properties.getSenderEmail().isEmpty()) {
      throw new IllegalStateException("Brevo confirmation is not configured");
    }
    if (!payload.plainText() && (!properties.isConfigured() || payload.templateId() < 1)) {
      throw new IllegalStateException("Brevo confirmation is not configured");
    }

    HttpRequest request = HttpRequest.newBuilder()
      .uri(URI.create(properties.getApiUrl()))
      .timeout(TIMEOUT)
      .header("api-key", properties.getApiKey())
      .header("accept", "application/json")
      .header("content-type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(
        requestBody(payload, recipientEmail, subject)
      )))
      .build();

    HttpResponse<String> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Brevo confirmation was interrupted");
    } catch (Exception exception) {
      throw new IllegalStateException("Brevo confirmation could not be sent");
    }

    int status = response.statusCode();
    if (status < 200 || status >= 300) {
      throw new IllegalStateException("Brevo rejected the email (HTTP " + status + ")");
    }
  }

  Map<String, Object> requestBody(BrevoTemplatePayload payload, String recipientEmail, String subject) {
    Map<String, Object> sender = new LinkedHashMap<>();
    sender.put("email", properties.getSenderEmail());
    if (!properties.getSenderName().isEmpty()) {
      sender.put("name", properties.getSenderName());
    }

    Map<String, Object> recipient = new LinkedHashMap<>();
    recipient.put("email", recipientEmail);
    if (!payload.recipientName().isBlank()) {
      recipient.put("name", payload.recipientName());
    }

    Map<String, Object> body = new LinkedHashMap<>();
    body.put("sender", sender);
    body.put("to", List.of(recipient));
    if (payload.plainText()) {
      body.put("subject", subject);
      body.put("textContent", payload.textContent());
    } else {
      body.put("templateId", payload.templateId());
      body.put("params", payload.params());
    }
    return body;
  }
}
