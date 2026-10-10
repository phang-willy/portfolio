package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.github-stats")
public class GithubStatsProperties {

  private static final long DEFAULT_REFRESH_INTERVAL_MILLIS = 10_800_000L;

  private String token = "";
  private String username = "";
  private long refreshIntervalMillis = DEFAULT_REFRESH_INTERVAL_MILLIS;

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

  public long getRefreshIntervalMillis() {
    return refreshIntervalMillis > 0 ? refreshIntervalMillis : DEFAULT_REFRESH_INTERVAL_MILLIS;
  }

  public void setRefreshIntervalMillis(long refreshIntervalMillis) {
    this.refreshIntervalMillis = refreshIntervalMillis;
  }
}
