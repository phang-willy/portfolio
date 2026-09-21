package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.event.EmailDeliveryRequestedEvent;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.EmailContentEncryptionService;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailQueueService {

  private static final Logger LOGGER = LoggerFactory.getLogger(EmailQueueService.class);
  private static final String EMAIL_QUEUE_NOT_FOUND_CODE = "EMAIL_QUEUE_NOT_FOUND";
  private static final String EMAIL_QUEUE_NOT_FOUND_MESSAGE = "Email not found";
  private static final String EMAIL_QUEUE_NOT_FAILED_CODE = "EMAIL_QUEUE_NOT_FAILED";
  private static final String EMAIL_QUEUE_NOT_FAILED_MESSAGE = "Only failed emails can be resent";

  private final EmailQueueRepository emailQueueRepository;
  private final EmailQueueProperties properties;
  private final EmailQueueDeliveryService deliveryService;
  private final EmailContentEncryptionService emailContentEncryptionService;
  private final ApplicationEventPublisher applicationEventPublisher;
  private final Clock clock;

  public EmailQueueService(
    EmailQueueRepository emailQueueRepository,
    EmailQueueProperties properties,
    EmailQueueDeliveryService deliveryService,
    EmailContentEncryptionService emailContentEncryptionService,
    ApplicationEventPublisher applicationEventPublisher,
    Clock clock
  ) {
    this.emailQueueRepository = emailQueueRepository;
    this.properties = properties;
    this.deliveryService = deliveryService;
    this.emailContentEncryptionService = emailContentEncryptionService;
    this.applicationEventPublisher = applicationEventPublisher;
    this.clock = clock;
  }

  @Transactional
  public EmailQueue enqueue(String recipient, String subject, String body) {
    return enqueue(new EmailMessage(recipient, subject, body));
  }

  @Transactional
  public EmailQueue enqueue(EmailMessage email) {
    EmailQueue saved = emailQueueRepository.saveAndFlush(new EmailQueue(
      email.recipient(),
      email.subject(),
      emailContentEncryptionService.encrypt(email.body()),
      email.html(),
      Instant.now(clock)
    ));
    publishChange(saved);
    return saved;
  }

  @Transactional
  public void requestDelivery(UUID id) {
    applicationEventPublisher.publishEvent(new EmailDeliveryRequestedEvent(id));
  }

  @Transactional
  public EmailQueueAdminListItem resend(UUID id) {
    EmailQueue email = emailQueueRepository
      .findByIdForUpdate(id)
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

  public void processPendingEmails() {
    Instant now = Instant.now(clock);
    List<UUID> pendingIds = emailQueueRepository
      .findDueIds(
        EmailQueueStatus.PENDING,
        now,
        PageRequest.of(0, properties.getBatchSize())
      );

    for (UUID id : pendingIds) {
      try {
        deliveryService.deliver(id);
      } catch (RuntimeException exception) {
        LOGGER.warn("Email delivery transaction failed for {}; scheduler will retry ({})",
          id, exception.getClass().getSimpleName());
      }
    }
  }

  private EmailQueueAdminListItem toListItem(EmailQueue email) {
    return EmailQueueAdminListItem.from(email, properties.getMaxAttempts());
  }

  private void publishChange(EmailQueue email) {
    applicationEventPublisher.publishEvent(new EmailQueueChangedEvent(toListItem(email)));
  }

}
