package com.phangwilly.portfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class EmailQueueDeliveryConfiguration {

  private static final int WORKER_COUNT = 2;
  private static final int QUEUE_CAPACITY = 100;
  private static final int SHUTDOWN_WAIT_SECONDS = 30;

  @Bean(name = "emailQueueExecutor", defaultCandidate = false)
  public ThreadPoolTaskExecutor emailQueueExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(WORKER_COUNT);
    executor.setMaxPoolSize(WORKER_COUNT);
    executor.setQueueCapacity(QUEUE_CAPACITY);
    executor.setThreadNamePrefix("email-queue-");
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setAwaitTerminationSeconds(SHUTDOWN_WAIT_SECONDS);
    return executor;
  }
}
