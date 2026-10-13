package com.phangwilly.portfolio.service;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

public final class GithubRepoUrls {

  private GithubRepoUrls() {
  }

  /** Source link first, then the production link when it points at github.com. */
  public static Optional<GithubRepoRef> fromLinks(String sourceCodeLink, String productionLink) {
    Optional<GithubRepoRef> source = parse(sourceCodeLink);
    if (source.isPresent()) {
      return source;
    }
    return parse(productionLink);
  }

  public static Optional<GithubRepoRef> parse(String url) {
    if (url == null || url.isBlank()) {
      return Optional.empty();
    }

    URI uri;
    try {
      uri = URI.create(url.trim());
    } catch (IllegalArgumentException exception) {
      return Optional.empty();
    }

    String host = uri.getHost();
    if (host == null) {
      return Optional.empty();
    }
    host = host.toLowerCase(Locale.ROOT);
    if (host.startsWith("www.")) {
      host = host.substring(4);
    }
    if (!"github.com".equals(host)) {
      return Optional.empty();
    }

    String path = uri.getPath();
    if (path == null || path.isBlank()) {
      return Optional.empty();
    }

    List<String> segments = new ArrayList<>();
    for (String segment : path.split("/")) {
      if (!segment.isBlank()) {
        segments.add(segment);
      }
    }
    if (segments.size() < 2) {
      return Optional.empty();
    }

    String owner = segments.get(0);
    String repo = segments.get(1).replaceAll("(?i)\\.git$", "");
    if (owner.isBlank() || repo.isBlank()) {
      return Optional.empty();
    }
    return Optional.of(new GithubRepoRef(owner, repo));
  }
}
