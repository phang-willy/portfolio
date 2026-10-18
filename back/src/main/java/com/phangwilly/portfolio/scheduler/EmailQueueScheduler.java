package com.phangwilly.portfolio.scheduler;

import com.phangwilly.portfolio.service.EmailQueueService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class EmailQueueScheduler {

  private final EmailQueueService emailQueueService;

  public EmailQueueScheduler(EmailQueueService emailQueueService) {
    this.emailQueueService = emailQueueService;
  }

  @Scheduled(fixedDelayString = "${app.email-queue.scheduler-delay-millis:60000}")
  public void processPendingEmails() {
    emailQueueService.processPendingEmails();
  }
}
