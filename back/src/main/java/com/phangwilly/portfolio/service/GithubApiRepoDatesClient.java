package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.GithubStatsProperties;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Repo creation date, and {@code pushed_at}: the last push on any branch.
 * Falls back to {@code updated_at} when GitHub does not send a push date.
 */
@Service
public class GithubApiRepoDatesClient implements GithubRepoDatesClient {

  private static final Logger LOGGER = LoggerFactory.getLogger(GithubApiRepoDatesClient.class);
  private static final Duration TIMEOUT = Duration.ofSeconds(8);
  private static final String API = "https://api.github.com/repos/";

  private final GithubStatsProperties properties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newBuilder()
    .connectTimeout(TIMEOUT)
    .followRedirects(HttpClient.Redirect.NEVER)
    .build();

  public GithubApiRepoDatesClient(GithubStatsProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  @Override
  public Optional<GithubRepoDates> fetch(GithubRepoRef repo) {
    try {
      JsonNode body = getJson(repoUrl(repo));
      if (body == null || !body.isObject()) {
        return Optional.empty();
      }

      Instant createdAt = parseInstant(text(body, "created_at")).orElse(null);
      Instant updatedAt = latestPushAt(
        parseInstant(text(body, "pushed_at")).orElse(null),
        parseInstant(text(body, "updated_at")).orElse(null)
      );
      if (createdAt == null && updatedAt == null) {
        return Optional.empty();
      }

      return Optional.of(new GithubRepoDates(createdAt, updatedAt));
    } catch (RuntimeException exception) {
      LOGGER.warn(
        "GitHub dates skipped for {}/{} ({})",
        repo.owner(),
        repo.repo(),
        exception.getClass().getSimpleName()
      );
      return Optional.empty();
    }
  }

  /** Last push on any branch. {@code updated_at} only fills in when {@code pushed_at} is missing. */
  static Instant latestPushAt(Instant pushedAt, Instant updatedAt) {
    if (pushedAt != null) {
      return pushedAt;
    }
    return updatedAt;
  }

  private JsonNode getJson(String url) {
    HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(url))
      .timeout(TIMEOUT)
      .header("Accept", "application/vnd.github+json")
      .header("User-Agent", "portfolio-api")
      .header("X-GitHub-Api-Version", "2022-11-28")
      .GET();
    String token = properties.getToken();
    if (!token.isEmpty()) {
      builder.header("Authorization", "Bearer " + token);
    }

    HttpResponse<String> response;
    try {
      response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("GitHub request was interrupted");
    } catch (Exception exception) {
      throw new IllegalStateException("GitHub request failed");
    }

    int status = response.statusCode();
    if (status == 403 || status == 429) {
      throw new IllegalStateException("GitHub rate limit");
    }
    if (status < 200 || status >= 300) {
      return null;
    }
    return objectMapper.readTree(response.body());
  }

  private static String repoUrl(GithubRepoRef repo) {
    return API
      + URLEncoder.encode(repo.owner(), StandardCharsets.UTF_8)
      + "/"
      + URLEncoder.encode(repo.repo(), StandardCharsets.UTF_8);
  }

  private static String text(JsonNode node, String field) {
    if (node == null) {
      return "";
    }
    JsonNode value = node.path(field);
    return value.isTextual() ? value.asString() : "";
  }

  private static Optional<Instant> parseInstant(String raw) {
    if (raw == null || raw.isBlank()) {
      return Optional.empty();
    }
    try {
      return Optional.of(Instant.parse(raw));
    } catch (RuntimeException exception) {
      return Optional.empty();
    }
  }
}
