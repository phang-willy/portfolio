package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.phangwilly.portfolio.dto.ContactHistoryItem;
import com.phangwilly.portfolio.enums.ContactHistoryType;
import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.repository.ContactHistoryRepository;
import com.phangwilly.portfolio.repository.ContactRepository;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.scheduler.EmailQueueScheduler;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import java.sql.DriverManager;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Opt-in PostgreSQL tests: all data lives in a disposable, uniquely named schema. */
@SpringBootTest(properties = {"app.title=Integration", "app.email-queue.retry-delay=1h"})
@EnabledIfEnvironmentVariable(named = "CONTACT_INTEGRATION_TEST", matches = "true")
class ContactIntegrationTest {

  private static final String SCHEMA = "contact_it_" + UUID.randomUUID().toString().replace("-", "");
  private static final Duration ASYNC_TIMEOUT = Duration.ofSeconds(10);

  @Autowired private ContactService receiptService;
  @Autowired private ContactAdminService adminService;
  @Autowired private ContactRepository contacts;
  @Autowired private ContactHistoryRepository history;
  @Autowired private EmailQueueRepository emails;
  @Autowired private UserRepository users;
  @Autowired private EmailQueueService queueService;
  @Autowired private EmailQueueDeliveryService deliveryService;
  @Autowired private PlatformTransactionManager transactions;
  @Autowired private JdbcTemplate jdbc;
  @MockitoBean private EmailSender sender;
  @MockitoBean private EmailQueueScheduler scheduler;

  @DynamicPropertySource
  static void configureIsolatedSchema(DynamicPropertyRegistry properties) throws Exception {
    executeSchemaStatement("CREATE SCHEMA \"" + SCHEMA + "\"");
    properties.add("spring.flyway.schemas", () -> SCHEMA);
    properties.add("spring.flyway.default-schema", () -> SCHEMA);
    properties.add("spring.datasource.hikari.schema", () -> SCHEMA);
    properties.add("spring.jpa.properties.hibernate.default_schema", () -> SCHEMA);
  }

  @BeforeEach
  void authenticateAdmin() {
    history.deleteAll();
    contacts.deleteAll();
    emails.deleteAll();
    users.deleteAll();
    User user = new User("Admin", "Test", "contact-admin@example.test");
    user.changeRole(UserRole.ADMIN);
    users.saveAndFlush(user);
    var principal = new AuthenticatedUser(user.getId(), user.getEmail(), UserRole.ADMIN, "test-only");
    SecurityContextHolder.getContext().setAuthentication(
      new UsernamePasswordAuthenticationToken(principal, null, List.of())
    );
  }

  @AfterEach
  void clearAuthentication() {
    SecurityContextHolder.clearContext();
  }

  @AfterAll
  static void dropTestSchema() throws Exception {
    executeSchemaStatement("DROP SCHEMA IF EXISTS \"" + SCHEMA + "\" CASCADE");
  }

  @Test
  void storesVisitsAndDeliversReplyWithFullSubjectAndLinkedHistory() {
    Contact contact = receive("s".repeat(255));
    assertThat(adminService.getUnreadCount().count()).isEqualTo(1);
    assertThat(adminService.getContact(contact.getId()).status()).isEqualTo(ContactStatus.RECEIVED);
    assertThat(adminService.getContacts(0, 25, "Léa Martin", ContactStatus.RECEIVED).data()).hasSize(1);
    assertThat(adminService.getContacts(0, 25, "%", null).data()).isEmpty();

    var firstVisit = adminService.markRead(contact.getId());
    var secondVisit = adminService.markRead(contact.getId());
    assertThat(secondVisit.firstReadAt()).isEqualTo(firstVisit.firstReadAt());
    assertThat(secondVisit.history()).extracting(ContactHistoryItem::type)
      .containsExactly(ContactHistoryType.RECEIVED, ContactHistoryType.READ, ContactHistoryType.READ);
    assertThat(adminService.getUnreadCount().count()).isZero();

    var reply = adminService.reply(contact.getId(), "Merci pour votre demande.\nVoici la réponse.");
    UUID emailId = reply.history().getLast().emailQueueId();
    await().atMost(ASYNC_TIMEOUT).untilAsserted(() ->
      assertThat(emails.findById(emailId).orElseThrow().getStatus()).isEqualTo(EmailQueueStatus.SENT)
    );
    var delivered = adminService.getContact(contact.getId()).history().getLast();
    assertThat(delivered.subject()).isEqualTo("Integration - SUITE : " + "s".repeat(255));
    assertThat(delivered.emailStatus()).isEqualTo(EmailQueueStatus.SENT);
    assertThat(delivered.sentAt()).isNotNull();
    assertThat(delivered.actorName()).isEqualTo("Test Admin");
    assertThat(delivered.message()).isEqualTo("Merci pour votre demande.\nVoici la réponse.");
    assertThat(adminService.markRead(contact.getId()).status()).isEqualTo(ContactStatus.REPLIED);

    ArgumentCaptor<EmailMessage> captured = ArgumentCaptor.forClass(EmailMessage.class);
    verify(sender).send(captured.capture());
    assertThat(captured.getValue().html()).isTrue();
    assertThat(captured.getValue().body()).contains("Voici la réponse.", ">Message</p>");
    assertThat(emails.findById(emailId).orElseThrow().getBody()).doesNotContain("Voici la réponse.");
  }

  @Test
  void rollbackDoesNotSendOrLeavePartialHistory() {
    Contact contact = receive("Rollback");
    new TransactionTemplate(transactions).executeWithoutResult(transaction -> {
      adminService.reply(contact.getId(), "This reply must never be sent.");
      transaction.setRollbackOnly();
    });

    assertThat(emails.count()).isZero();
    assertThat(history.count()).isZero();
    assertThat(adminService.getContact(contact.getId()).status()).isEqualTo(ContactStatus.RECEIVED);
    verifyNoInteractions(sender);
  }

  @Test
  void retriesFailedDeliveryWithoutLosingReplyHistory() {
    Contact contact = receive("Retry");
    doThrow(new IllegalStateException("SMTP unavailable")).doNothing().when(sender).send(any());
    var reply = adminService.reply(contact.getId(), "Une réponse durable.");
    UUID emailId = reply.history().getLast().emailQueueId();
    await().atMost(ASYNC_TIMEOUT).untilAsserted(() -> {
      var email = emails.findById(emailId).orElseThrow();
      assertThat(email.getAttempts()).isEqualTo(1);
      assertThat(email.getStatus()).isEqualTo(EmailQueueStatus.PENDING);
    });

    deliveryService.deliver(emailId);
    verify(sender, times(1)).send(any());
    jdbc.update("UPDATE email_queue SET scheduled_at = CURRENT_TIMESTAMP WHERE id = ?", emailId);
    queueService.processPendingEmails();

    assertThat(adminService.getContact(contact.getId()).history().getLast().emailStatus())
      .isEqualTo(EmailQueueStatus.SENT);
    assertThat(emails.findById(emailId).orElseThrow().getLastError()).hasSize(1);
    verify(sender, times(2)).send(any());
  }

  @Test
  void simultaneousWorkersOnlySendAnEmailOnce() throws Exception {
    UUID emailId = queueService.enqueue("test@example.test", "Concurrency", "Test").getId();
    CountDownLatch sending = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    doAnswer(invocation -> {
      sending.countDown();
      assertThat(release.await(5, TimeUnit.SECONDS)).isTrue();
      return null;
    }).when(sender).send(any());

    try (var workers = Executors.newFixedThreadPool(2)) {
      var first = workers.submit(() -> deliveryService.deliver(emailId));
      try {
        assertThat(sending.await(5, TimeUnit.SECONDS)).isTrue();
        workers.submit(() -> deliveryService.deliver(emailId)).get(2, TimeUnit.SECONDS);
        verify(sender, times(1)).send(any());
      } finally {
        release.countDown();
      }
      first.get(5, TimeUnit.SECONDS);
    }
    assertThat(emails.findById(emailId).orElseThrow().getStatus()).isEqualTo(EmailQueueStatus.SENT);
  }

  private Contact receive(String subject) {
    return receiptService.receive(new Contact(
      "Léa", "Martin", "lea@example.test", null, "Atelier", subject, "Une demande de contact."
    ));
  }

  private static void executeSchemaStatement(String sql) throws Exception {
    String url = System.getenv().getOrDefault("SPRING_DATASOURCE_URL", "jdbc:postgresql://localhost:5432/portfolio");
    String username = System.getenv().getOrDefault("SPRING_DATASOURCE_USERNAME", "portfolio");
    String password = System.getenv().getOrDefault("SPRING_DATASOURCE_PASSWORD", "portfolio");
    try (var connection = DriverManager.getConnection(url, username, password);
         var statement = connection.createStatement()) {
      statement.execute(sql);
    }
  }
}
