package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.GithubTokenReminderProperties;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class GithubApiTokenExpirationClient implements GithubTokenExpirationClient {

  private static final URI USER = URI.create("https://api.github.com/user");
  private static final Duration TIMEOUT = Duration.ofSeconds(10);

  private final GithubTokenReminderProperties properties;
  private final HttpClient httpClient = HttpClient.newBuilder()
    .connectTimeout(TIMEOUT)
    .followRedirects(HttpClient.Redirect.NEVER)
    .build();

  public GithubApiTokenExpirationClient(GithubTokenReminderProperties properties) {
    this.properties = properties;
  }

  @Override
  public Optional<Instant> currentExpiration() {
    String token = properties.getToken();
    if (token.isEmpty()) {
      return Optional.empty();
    }

    HttpRequest request = HttpRequest.newBuilder(USER)
      .timeout(TIMEOUT)
      .header("Authorization", "Bearer " + token)
      .header("Accept", "application/vnd.github+json")
      .header("X-GitHub-Api-Version", "2022-11-28")
      .GET()
      .build();

    HttpResponse<Void> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("GitHub token check was interrupted");
    } catch (Exception exception) {
      throw new IllegalStateException("GitHub token check failed");
    }

    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("GitHub token check failed (HTTP " + response.statusCode() + ")");
    }

    return parseExpiration(response.headers().firstValue("github-authentication-token-expiration").orElse(""));
  }

  static Optional<Instant> parseExpiration(String raw) {
    if (raw == null || raw.isBlank()) {
      return Optional.empty();
    }
    String trimmed = raw.trim();
    String iso = trimmed.endsWith(" UTC")
      ? trimmed.substring(0, trimmed.length() - 4) + "Z"
      : trimmed;
    iso = iso.replace(' ', 'T');
    try {
      return Optional.of(Instant.parse(iso));
    } catch (DateTimeParseException exception) {
      return Optional.empty();
    }
  }
}
