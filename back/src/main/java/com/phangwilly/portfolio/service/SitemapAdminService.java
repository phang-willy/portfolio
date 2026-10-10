package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.SitemapProperties;
import com.phangwilly.portfolio.dto.SitemapGenerationResponse;
import com.phangwilly.portfolio.exception.ApiException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class SitemapAdminService {

  static final String NOT_CONFIGURED = "Sitemap generation is not configured";
  static final String UNAVAILABLE = "The portfolio site is unavailable";
  static final String FAILED = "Sitemap generation failed";

  private static final Logger log = LoggerFactory.getLogger(SitemapAdminService.class);
  private static final Pattern URL_COUNT = Pattern.compile("\"urlCount\"\\s*:\\s*(\\d+)");

  private final SitemapProperties properties;
  private final HttpClient httpClient;

  public SitemapAdminService(SitemapProperties properties) {
    this.properties = properties;
    this.httpClient = HttpClient.newBuilder()
      .version(HttpClient.Version.HTTP_1_1)
      .connectTimeout(Duration.ofMillis(Math.max(1, properties.getTimeoutMillis())))
      .build();
  }

  public SitemapGenerationResponse generate() {
    String frontUrl = normalize(properties.getFrontUrl());
    String token = properties.getToken() == null ? "" : properties.getToken().trim();
    if (frontUrl.isEmpty() || token.isEmpty()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "SITEMAP_NOT_CONFIGURED", NOT_CONFIGURED);
    }

    HttpRequest request = HttpRequest.newBuilder(URI.create(frontUrl + "/api/sitemap"))
      .timeout(Duration.ofMillis(Math.max(1, properties.getTimeoutMillis())))
      .header("X-Sitemap-Token", token)
      .header("Accept", "application/json")
      .POST(HttpRequest.BodyPublishers.noBody())
      .build();

    HttpResponse<String> response;
    try {
      response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      log.warn("Sitemap generation call failed", exception);
      throw new ApiException(HttpStatus.BAD_GATEWAY, "SITEMAP_GENERATION_FAILED", UNAVAILABLE);
    } catch (Exception exception) {
      log.warn("Sitemap generation call failed", exception);
      throw new ApiException(HttpStatus.BAD_GATEWAY, "SITEMAP_GENERATION_FAILED", UNAVAILABLE);
    }

    if (response.statusCode() != HttpStatus.OK.value()) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "SITEMAP_GENERATION_FAILED", FAILED);
    }

    int urlCount = readUrlCount(response.body());
    if (urlCount < 0) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "SITEMAP_GENERATION_FAILED", FAILED);
    }
    return new SitemapGenerationResponse(urlCount);
  }

  private static int readUrlCount(String body) {
    if (body == null) {
      return -1;
    }
    Matcher matcher = URL_COUNT.matcher(body);
    if (!matcher.find()) {
      return -1;
    }
    return Integer.parseInt(matcher.group(1));
  }

  private static String normalize(String value) {
    if (value == null) {
      return "";
    }
    return value.trim().replaceAll("/+$", "");
  }
}
