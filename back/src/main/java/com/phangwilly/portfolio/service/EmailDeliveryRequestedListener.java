package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.event.EmailDeliveryRequestedEvent;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class EmailDeliveryRequestedListener {

  private static final Logger LOGGER = LoggerFactory.getLogger(EmailDeliveryRequestedListener.class);

  private final EmailQueueDeliveryService deliveryService;
  private final Executor executor;

  public EmailDeliveryRequestedListener(
    EmailQueueDeliveryService deliveryService,
    @Qualifier("emailQueueExecutor") Executor executor
  ) {
    this.deliveryService = deliveryService;
    this.executor = executor;
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onDeliveryRequested(EmailDeliveryRequestedEvent event) {
    try {
      executor.execute(() -> deliver(event.emailId()));
    } catch (RejectedExecutionException exception) {
      LOGGER.warn("Immediate email delivery deferred to scheduler for {}", event.emailId());
    }
  }

  private void deliver(UUID emailId) {
    try {
      deliveryService.deliver(emailId);
    } catch (RuntimeException exception) {
      LOGGER.warn("Email delivery transaction failed for {}; scheduler will retry ({})",
        emailId, exception.getClass().getSimpleName());
    }
  }
}
