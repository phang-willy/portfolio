package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

  private static final String DEFAULT_PUBLIC_BASE_URL = "http://localhost:8000";
  private static final String DEFAULT_ADMIN_BASE_URL = "http://localhost:3001/admin";
  private static final String DEFAULT_JWT_SECRET =
    "change-this-dev-jwt-secret-with-at-least-32-characters";
  private static final String DEFAULT_TOKEN_HASH_SECRET =
    "change-this-dev-token-hash-secret-with-at-least-32-characters";

  private boolean registerEnabled;
  private String publicBaseUrl = DEFAULT_PUBLIC_BASE_URL;
  private String adminBaseUrl = DEFAULT_ADMIN_BASE_URL;
  private String jwtSecret = DEFAULT_JWT_SECRET;
  private String tokenHashSecret = DEFAULT_TOKEN_HASH_SECRET;

  public boolean isRegisterEnabled() {
    return registerEnabled;
  }

  public void setRegisterEnabled(boolean registerEnabled) {
    this.registerEnabled = registerEnabled;
  }

  public String getPublicBaseUrl() {
    return publicBaseUrl;
  }

  public void setPublicBaseUrl(String publicBaseUrl) {
    this.publicBaseUrl = requireTextOrDefault(publicBaseUrl, DEFAULT_PUBLIC_BASE_URL);
  }

  public String getAdminBaseUrl() {
    return adminBaseUrl;
  }

  public void setAdminBaseUrl(String adminBaseUrl) {
    this.adminBaseUrl = requireTextOrDefault(adminBaseUrl, DEFAULT_ADMIN_BASE_URL);
  }

  public String getJwtSecret() {
    return jwtSecret;
  }

  public void setJwtSecret(String jwtSecret) {
    this.jwtSecret = requireTextOrDefault(jwtSecret, DEFAULT_JWT_SECRET);
  }

  public String getTokenHashSecret() {
    return tokenHashSecret;
  }

  public void setTokenHashSecret(String tokenHashSecret) {
    this.tokenHashSecret = requireTextOrDefault(tokenHashSecret, DEFAULT_TOKEN_HASH_SECRET);
  }

  private static String requireTextOrDefault(String value, String defaultValue) {
    return value == null || value.isBlank() ? defaultValue : value;
  }
}
