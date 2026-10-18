package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.email")
public class EmailProperties {

  private static final String DEFAULT_FROM = "noreply@phangwilly.local";

  private String from = DEFAULT_FROM;

  public String getFrom() {
    return from;
  }

  public void setFrom(String from) {
    this.from = from == null || from.isBlank() ? DEFAULT_FROM : from;
  }
}
