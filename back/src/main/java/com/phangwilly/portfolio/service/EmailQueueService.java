package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.EmailContentEncryptionService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailQueueService {

  private static final int LAST_ERROR_MAX_LENGTH = 2_000;

  private final EmailQueueRepository emailQueueRepository;
  private final EmailQueueProperties properties;
  private final EmailSender emailSender;
  private final EmailContentEncryptionService emailContentEncryptionService;
  private final Clock clock;

  public EmailQueueService(
    EmailQueueRepository emailQueueRepository,
    EmailQueueProperties properties,
    EmailSender emailSender,
    EmailContentEncryptionService emailContentEncryptionService,
    Clock clock
  ) {
    this.emailQueueRepository = emailQueueRepository;
    this.properties = properties;
    this.emailSender = emailSender;
    this.emailContentEncryptionService = emailContentEncryptionService;
    this.clock = clock;
  }

  @Transactional
  public EmailQueue enqueue(String recipient, String subject, String body) {
    return emailQueueRepository.save(new EmailQueue(
      recipient,
      subject,
      emailContentEncryptionService.encrypt(body),
      Instant.now(clock)
    ));
  }

  @Transactional
  public void processPendingEmails() {
    Instant now = Instant.now(clock);
    List<EmailQueue> pendingEmails = emailQueueRepository
      .findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
        EmailQueueStatus.PENDING,
        now,
        PageRequest.of(0, properties.getBatchSize())
      );

    pendingEmails.forEach(email -> processEmail(email, now));
  }

  private void processEmail(EmailQueue email, Instant now) {
    try {
      emailSender.send(new EmailMessage(
        email.getRecipient(),
        email.getSubject(),
        emailContentEncryptionService.decrypt(email.getBody())
      ));
      email.markSent(now);
    } catch (Exception exception) {
      String errorMessage = truncate(exception.getMessage());
      if (email.getAttempts() + 1 >= properties.getMaxAttempts()) {
        email.markFailed(errorMessage);
        return;
      }

      email.rescheduleAfterFailure(errorMessage, now.plus(properties.getRetryDelay()));
    }
  }

  private static String truncate(String value) {
    if (value == null || value.length() <= LAST_ERROR_MAX_LENGTH) {
      return value;
    }
    return value.substring(0, LAST_ERROR_MAX_LENGTH);
  }
}
