package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.github-stats")
public class GithubStatsProperties {

  private String token = "";
  private String username = "";

  public String getToken() {
    return token == null ? "" : token.trim();
  }

  public void setToken(String token) {
    this.token = token;
  }

  public String getUsername() {
    return username == null ? "" : username.trim();
  }

  public void setUsername(String username) {
    this.username = username;
  }
}
