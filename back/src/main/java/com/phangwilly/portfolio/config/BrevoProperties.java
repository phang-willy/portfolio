package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.brevo")
public class BrevoProperties {

  private String apiKey = "";
  private String senderEmail = "";
  private String senderName = "";
  private String contactTemplateId = "";
  private String apiUrl = "https://api.brevo.com/v3/smtp/email";
  private String contactToEmail = "";

  public String getApiKey() {
    return apiKey == null ? "" : apiKey.trim();
  }

  public void setApiKey(String apiKey) {
    this.apiKey = apiKey;
  }

  public String getSenderEmail() {
    return senderEmail == null ? "" : senderEmail.trim();
  }

  public void setSenderEmail(String senderEmail) {
    this.senderEmail = senderEmail;
  }

  public String getSenderName() {
    return senderName == null ? "" : senderName.trim();
  }

  public void setSenderName(String senderName) {
    this.senderName = senderName;
  }

  public String getContactTemplateId() {
    return contactTemplateId;
  }

  public void setContactTemplateId(String contactTemplateId) {
    this.contactTemplateId = contactTemplateId;
  }

  public int contactTemplateIdValue() {
    if (contactTemplateId == null || contactTemplateId.isBlank()) {
      return 0;
    }
    try {
      return Integer.parseInt(contactTemplateId.trim());
    } catch (NumberFormatException exception) {
      return 0;
    }
  }

  public String getApiUrl() {
    return apiUrl == null || apiUrl.isBlank() ? "https://api.brevo.com/v3/smtp/email" : apiUrl.trim();
  }

  public void setApiUrl(String apiUrl) {
    this.apiUrl = apiUrl;
  }

  public String getContactToEmail() {
    return contactToEmail == null ? "" : contactToEmail.trim();
  }

  public void setContactToEmail(String contactToEmail) {
    this.contactToEmail = contactToEmail;
  }

  public boolean isConfigured() {
    return !getApiKey().isEmpty() && !getSenderEmail().isEmpty() && contactTemplateIdValue() > 0;
  }
}
