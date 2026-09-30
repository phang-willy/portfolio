package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.GithubStatsProperties;
import com.phangwilly.portfolio.dto.GithubStatsResponse;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class GithubApiStatsClient implements GithubStatsClient {

  private static final Logger LOGGER = LoggerFactory.getLogger(GithubApiStatsClient.class);
  private static final URI GRAPHQL = URI.create("https://api.github.com/graphql");
  private static final Duration TIMEOUT = Duration.ofSeconds(20);
  private static final String BASE_QUERY = """
    query GithubStatsBase {
      viewer {
        login
        createdAt
        repositories(ownerAffiliations: [OWNER, COLLABORATOR], first: 1) {
          totalCount
        }
      }
    }
    """;
  private static final String CHUNK_QUERY = """
    query GithubContributionsChunk($from: DateTime!, $to: DateTime!) {
      viewer {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
    """;

  private final GithubStatsProperties properties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient = HttpClient.newBuilder()
    .connectTimeout(TIMEOUT)
    .followRedirects(HttpClient.Redirect.NEVER)
    .build();

  public GithubApiStatsClient(GithubStatsProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  @Override
  public Optional<GithubStatsResponse> fetch() {
    if (properties.getToken().isEmpty()) {
      LOGGER.warn("GitHub stats skipped: GITHUB_TOKEN is not configured");
      return Optional.empty();
    }

    JsonNode viewer = query(BASE_QUERY, Map.of()).path("viewer");
    String login = text(viewer, "login");
    if (login.isEmpty()) {
      throw new IllegalStateException("GitHub stats response has no login");
    }
    String expected = properties.getUsername();
    if (!expected.isEmpty() && !login.equalsIgnoreCase(expected)) {
      LOGGER.warn("GitHub stats skipped: token account does not match GITHUB_USERNAME");
      return Optional.empty();
    }

    Instant createdAt = parseInstant(text(viewer, "createdAt")).orElse(Instant.parse("2008-01-01T00:00:00Z"));
    Instant until = Instant.now();
    int contributions = 0;
    Map<String, Integer> totals = new HashMap<>();
    for (Instant[] chunk : GithubStatsCalculator.yearChunks(createdAt, until)) {
      JsonNode calendar = query(CHUNK_QUERY, Map.of(
        "from", chunk[0].toString(),
        "to", chunk[1].toString()
      )).path("viewer").path("contributionsCollection").path("contributionCalendar");
      contributions += calendar.path("totalContributions").asInt(0);
      for (JsonNode week : calendar.path("weeks")) {
        for (JsonNode day : week.path("contributionDays")) {
          GithubStatsCalculator.addDay(totals, text(day, "date"), day.path("contributionCount").asInt(0));
        }
      }
    }

    Set<String> activeDays = new HashSet<>();
    totals.forEach((date, count) -> {
      if (count > 0) {
        activeDays.add(date);
      }
    });
    int repositories = viewer.path("repositories").path("totalCount").asInt(0);
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    return Optional.of(new GithubStatsResponse(
      contributions,
      repositories,
      GithubStatsCalculator.currentStreakDays(activeDays, today),
      GithubStatsCalculator.longestStreakDays(activeDays)
    ));
  }

  private JsonNode query(String query, Map<String, Object> variables) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("query", query);
    if (!variables.isEmpty()) {
      body.put("variables", variables);
    }
    HttpRequest request = HttpRequest.newBuilder(GRAPHQL)
      .timeout(TIMEOUT)
      .header("Authorization", "Bearer " + properties.getToken())
      .header("Accept", "application/json")
      .header("Content-Type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
      .build();

    HttpResponse<String> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("GitHub stats request was interrupted");
    } catch (Exception exception) {
      throw new IllegalStateException("GitHub stats request failed");
    }
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IllegalStateException("GitHub stats request failed (HTTP " + response.statusCode() + ")");
    }

    JsonNode payload = objectMapper.readTree(response.body());
    JsonNode errors = payload.path("errors");
    if (errors.isArray() && !errors.isEmpty()) {
      throw new IllegalStateException("GitHub stats query failed");
    }
    JsonNode data = payload.path("data");
    if (data.isMissingNode() || data.isNull()) {
      throw new IllegalStateException("GitHub stats response has no data");
    }
    return data;
  }

  private static String text(JsonNode node, String field) {
    JsonNode value = node.path(field);
    return value.isTextual() ? value.asString() : "";
  }

  private static Optional<Instant> parseInstant(String raw) {
    if (raw.isBlank()) {
      return Optional.empty();
    }
    try {
      return Optional.of(Instant.parse(raw));
    } catch (RuntimeException exception) {
      return Optional.empty();
    }
  }
}
