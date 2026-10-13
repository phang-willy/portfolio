package com.phangwilly.portfolio.config;

import org.springframework.boot.task.ThreadPoolTaskSchedulerBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

@Configuration
public class SchedulingConfig {

  public static final String GITHUB_PROJECT_SYNC_SCHEDULER = "githubProjectSyncScheduler";

  /**
   * Boot skips its default scheduler once any TaskScheduler exists.
   * This bean keeps heartbeats, health checks, and email processing on that pool.
   */
  @Bean(name = "taskScheduler")
  ThreadPoolTaskScheduler taskScheduler(ThreadPoolTaskSchedulerBuilder builder) {
    return builder.build();
  }

  /** Isolated from the shared scheduler so a slow GitHub sync cannot delay it. */
  @Bean(name = GITHUB_PROJECT_SYNC_SCHEDULER)
  ThreadPoolTaskScheduler githubProjectSyncScheduler() {
    ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    scheduler.setPoolSize(1);
    scheduler.setThreadNamePrefix("github-project-sync-");
    return scheduler;
  }
}
