package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.GithubStatsProperties;
import com.phangwilly.portfolio.dto.GithubStatsResponse;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/** Loads GitHub stats when the API starts, then refreshes them every three hours. */
@Service
public class GithubStatsService {

  private static final Logger LOGGER = LoggerFactory.getLogger(GithubStatsService.class);

  private final GithubStatsClient client;
  private final GithubStatsProperties properties;
  private final AtomicReference<GithubStatsResponse> current = new AtomicReference<>();
  private ScheduledExecutorService executor;

  public GithubStatsService(GithubStatsClient client, GithubStatsProperties properties) {
    this.client = client;
    this.properties = properties;
  }

  @PostConstruct
  void scheduleRefresh() {
    executor = Executors.newSingleThreadScheduledExecutor(task -> {
      Thread thread = new Thread(task, "github-stats");
      thread.setDaemon(true);
      return thread;
    });
    executor.scheduleAtFixedRate(
      this::refresh,
      0,
      properties.getRefreshIntervalMillis(),
      TimeUnit.MILLISECONDS
    );
  }

  @PreDestroy
  void stopRefresh() {
    if (executor != null) {
      executor.shutdownNow();
    }
  }

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
