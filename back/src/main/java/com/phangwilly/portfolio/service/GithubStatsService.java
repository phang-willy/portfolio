package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.GithubStatsResponse;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/** Loads GitHub stats when the API starts, then refreshes them every three hours. */
@Service
public class GithubStatsService {

  private static final Logger LOGGER = LoggerFactory.getLogger(GithubStatsService.class);

  private final GithubStatsClient client;
  private final AtomicReference<GithubStatsResponse> current = new AtomicReference<>();

  public GithubStatsService(GithubStatsClient client) {
    this.client = client;
  }

  @Scheduled(fixedRateString = "${app.github-stats.refresh-interval-millis:10800000}")
  public void refresh() {
    try {
      Optional<GithubStatsResponse> next = client.fetch();
      next.ifPresent(stats -> {
        current.set(stats);
        LOGGER.info("GitHub stats refreshed");
      });
    } catch (RuntimeException exception) {
      LOGGER.warn("GitHub stats refresh failed ({})", exception.getClass().getSimpleName());
    }
  }

  public GithubStatsResponse current() {
    return current.get();
  }
}
