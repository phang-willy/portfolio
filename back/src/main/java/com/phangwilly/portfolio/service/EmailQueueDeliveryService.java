package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.EmailQueueProperties;
import com.phangwilly.portfolio.dto.EmailQueueAdminListItem;
import com.phangwilly.portfolio.event.EmailQueueChangedEvent;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.security.EmailContentEncryptionService;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmailQueueDeliveryService {

  private static final int LAST_ERROR_MAX_LENGTH = 2_000;

  private final EmailQueueRepository emailQueueRepository;
  private final EmailQueueProperties properties;
  private final EmailSender emailSender;
  private final EmailContentEncryptionService emailContentEncryptionService;
  private final ApplicationEventPublisher applicationEventPublisher;
  private final Clock clock;

  public EmailQueueDeliveryService(
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

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void deliver(UUID id) {
    Instant now = Instant.now(clock);
    emailQueueRepository.findDueByIdForUpdate(id, now).ifPresent(email -> send(email, now));
  }

  private void send(EmailQueue email, Instant now) {
    try {
      emailSender.send(new EmailMessage(
        email.getRecipient(),
        email.getSubject(),
        emailContentEncryptionService.decrypt(email.getBody()),
        email.isHtml()
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
    applicationEventPublisher.publishEvent(new EmailQueueChangedEvent(
      EmailQueueAdminListItem.from(email, properties.getMaxAttempts())
    ));
  }

  private static String truncate(String value) {
    if (value == null || value.length() <= LAST_ERROR_MAX_LENGTH) {
      return value;
    }
    return value.substring(0, LAST_ERROR_MAX_LENGTH);
  }
}
