package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.sitemap")
public class SitemapProperties {

  private String frontUrl = "";
  private String token = "";
  private int timeoutMillis = 20_000;

  public String getFrontUrl() {
    return frontUrl;
  }

  public void setFrontUrl(String frontUrl) {
    this.frontUrl = frontUrl;
  }

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }

  public int getTimeoutMillis() {
    return timeoutMillis;
  }

  public void setTimeoutMillis(int timeoutMillis) {
    this.timeoutMillis = timeoutMillis;
  }
}
