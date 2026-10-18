package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.github-token-reminder")
public class GithubTokenReminderProperties {

  private String token = "";

  public String getToken() {
    return token == null ? "" : token.trim();
  }

  public void setToken(String token) {
    this.token = token;
  }
}
