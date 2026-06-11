package com.phangwilly.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

  private static final String DEFAULT_PUBLIC_BASE_URL = "http://localhost:8000";
  private static final String DEFAULT_ADMIN_BASE_URL = "http://localhost:3001";
  private static final String DEFAULT_JWT_SECRET =
    "change-this-dev-jwt-secret-with-at-least-32-characters";
  private static final String DEFAULT_TOKEN_HASH_SECRET =
    "change-this-dev-token-hash-secret-with-at-least-32-characters";
  private static final String DEFAULT_COOKIE_NAME = "access_token";
  private static final String DEFAULT_COOKIE_SAME_SITE = "None";
  private static final String DEFAULT_COOKIE_PATH = "/api";

  private boolean registerEnabled;
  private String publicBaseUrl = DEFAULT_PUBLIC_BASE_URL;
  private String adminBaseUrl = DEFAULT_ADMIN_BASE_URL;
  private String jwtSecret = DEFAULT_JWT_SECRET;
  private String tokenHashSecret = DEFAULT_TOKEN_HASH_SECRET;
  private String cookieName = DEFAULT_COOKIE_NAME;
  private boolean cookieSecure = true;
  private String cookieSameSite = DEFAULT_COOKIE_SAME_SITE;
  private String cookiePath = DEFAULT_COOKIE_PATH;

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

  public String getCookieName() {
    return cookieName;
  }

  public void setCookieName(String cookieName) {
    this.cookieName = requireTextOrDefault(cookieName, DEFAULT_COOKIE_NAME);
  }

  public boolean isCookieSecure() {
    return cookieSecure;
  }

  public void setCookieSecure(boolean cookieSecure) {
    this.cookieSecure = cookieSecure;
  }

  public String getCookieSameSite() {
    return cookieSameSite;
  }

  public void setCookieSameSite(String cookieSameSite) {
    this.cookieSameSite = requireTextOrDefault(cookieSameSite, DEFAULT_COOKIE_SAME_SITE);
  }

  public String getCookiePath() {
    return cookiePath;
  }

  public void setCookiePath(String cookiePath) {
    this.cookiePath = requireTextOrDefault(cookiePath, DEFAULT_COOKIE_PATH);
  }

  private static String requireTextOrDefault(String value, String defaultValue) {
    return value == null || value.isBlank() ? defaultValue : value;
  }
}
