package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.phangwilly.portfolio.event.EmailDeliveryRequestedEvent;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.transaction.event.TransactionalEventListenerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class EmailDeliveryRequestedListenerTest {

  private static final UUID EMAIL_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  @Mock
  private EmailQueueDeliveryService deliveryService;
  @Mock
  private Executor executor;

  @AfterEach
  void clearTransaction() {
    if (TransactionSynchronizationManager.isSynchronizationActive()) {
      TransactionSynchronizationManager.clearSynchronization();
    }
    TransactionSynchronizationManager.clear();
  }

  @Test
  void committedTransactionDispatchesDeliveryOnlyAfterCommit() {
    try (AnnotationConfigApplicationContext context = eventContext()) {
      beginTransaction();
      context.publishEvent(new EmailDeliveryRequestedEvent(EMAIL_ID));
      verifyNoInteractions(executor, deliveryService);

      completeTransaction(TransactionSynchronization.STATUS_COMMITTED);

      ArgumentCaptor<Runnable> task = ArgumentCaptor.forClass(Runnable.class);
      verify(executor).execute(task.capture());
      verifyNoInteractions(deliveryService);
      task.getValue().run();
      verify(deliveryService).deliver(EMAIL_ID);
    }
  }

  @Test
  void rolledBackTransactionDoesNotDispatchDelivery() {
    try (AnnotationConfigApplicationContext context = eventContext()) {
      beginTransaction();
      context.publishEvent(new EmailDeliveryRequestedEvent(EMAIL_ID));

      completeTransaction(TransactionSynchronization.STATUS_ROLLED_BACK);

      verifyNoInteractions(executor, deliveryService);
    }
  }

  @Test
  void saturatedExecutorLeavesPersistedQueueForScheduler() {
    EmailDeliveryRequestedListener listener = new EmailDeliveryRequestedListener(deliveryService, executor);
    doThrow(new RejectedExecutionException("full")).when(executor).execute(any());

    assertThatCode(() -> listener.onDeliveryRequested(new EmailDeliveryRequestedEvent(EMAIL_ID)))
      .doesNotThrowAnyException();

    verifyNoInteractions(deliveryService);
  }

  @Test
  void workerTransactionFailureDoesNotEscapeAsyncTask() {
    EmailDeliveryRequestedListener listener = new EmailDeliveryRequestedListener(deliveryService, Runnable::run);
    doThrow(new IllegalStateException("database unavailable")).when(deliveryService).deliver(EMAIL_ID);

    assertThatCode(() -> listener.onDeliveryRequested(new EmailDeliveryRequestedEvent(EMAIL_ID)))
      .doesNotThrowAnyException();
  }

  private AnnotationConfigApplicationContext eventContext() {
    AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
    context.registerBean(TransactionalEventListenerFactory.class);
    context.registerBean(EmailDeliveryRequestedListener.class,
      () -> new EmailDeliveryRequestedListener(deliveryService, executor));
    context.refresh();
    return context;
  }

  private static void beginTransaction() {
    TransactionSynchronizationManager.setActualTransactionActive(true);
    TransactionSynchronizationManager.initSynchronization();
  }

  private static void completeTransaction(int status) {
    TransactionSynchronizationManager.getSynchronizations()
      .forEach(synchronization -> synchronization.afterCompletion(status));
  }
}
