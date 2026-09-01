package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.EmailContentEncryptionService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailQueueService {

  private static final int LAST_ERROR_MAX_LENGTH = 2_000;
  private static final String EMAIL_QUEUE_NOT_FOUND_CODE = "EMAIL_QUEUE_NOT_FOUND";
  private static final String EMAIL_QUEUE_NOT_FOUND_MESSAGE = "Email not found";
  private static final String EMAIL_QUEUE_NOT_FAILED_CODE = "EMAIL_QUEUE_NOT_FAILED";
  private static final String EMAIL_QUEUE_NOT_FAILED_MESSAGE = "Only failed emails can be resent";

  private final EmailQueueRepository emailQueueRepository;
  private final EmailQueueProperties properties;
  private final EmailSender emailSender;
  private final EmailContentEncryptionService emailContentEncryptionService;
  private final ApplicationEventPublisher applicationEventPublisher;
  private final Clock clock;

  public EmailQueueService(
    EmailQueueRepository emailQueueRepository,
    EmailQueueProperties properties,
    EmailSender emailSender,
    EmailContentEncryptionService emailContentEncryptionService,
    ApplicationEventPublisher applicationEventPublisher,
    Clock clock
  ) {
    this.emailQueueRepository = emailQueueRepository;
    this.properties = properties;
    this.emailSender = emailSender;
    this.emailContentEncryptionService = emailContentEncryptionService;
    this.applicationEventPublisher = applicationEventPublisher;
    this.clock = clock;
  }

  @Transactional
  public EmailQueue enqueue(String recipient, String subject, String body) {
    EmailQueue saved = emailQueueRepository.saveAndFlush(new EmailQueue(
      recipient,
      subject,
      emailContentEncryptionService.encrypt(body),
      Instant.now(clock)
    ));
    publishChange(saved);
    return saved;
  }

  @Transactional
  public EmailQueueAdminListItem resend(UUID id) {
    EmailQueue email = emailQueueRepository
      .findById(id)
      .orElseThrow(() -> new ApiException(
        HttpStatus.NOT_FOUND,
        EMAIL_QUEUE_NOT_FOUND_CODE,
        EMAIL_QUEUE_NOT_FOUND_MESSAGE
      ));

    if (email.getStatus() != EmailQueueStatus.FAILED) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        EMAIL_QUEUE_NOT_FAILED_CODE,
        EMAIL_QUEUE_NOT_FAILED_MESSAGE
      );
    }

    email.resend(Instant.now(clock));
    EmailQueue saved = emailQueueRepository.saveAndFlush(email);
    publishChange(saved);
    return toListItem(saved);
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
        email.markFailed(errorMessage, now);
      } else {
        email.rescheduleAfterFailure(errorMessage, now, now.plus(properties.getRetryDelay()));
      }
    }

    emailQueueRepository.save(email);
    publishChange(email);
  }

  private EmailQueueAdminListItem toListItem(EmailQueue email) {
    return EmailQueueAdminListItem.from(email, properties.getMaxAttempts());
  }

  private void publishChange(EmailQueue email) {
    applicationEventPublisher.publishEvent(new EmailQueueChangedEvent(toListItem(email)));
  }

  private static String truncate(String value) {
    if (value == null || value.length() <= LAST_ERROR_MAX_LENGTH) {
      return value;
    }
    return value.substring(0, LAST_ERROR_MAX_LENGTH);
  }
}
