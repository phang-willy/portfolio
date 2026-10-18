package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.BrevoProperties;
import com.phangwilly.portfolio.enums.EmailChannel;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.EmailQueueRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

/** Queues the GitHub token reminder in email_queue, then Brevo sends it. */
@Service
public class GithubTokenReminderService {

  static final String SUBJECT = "Rappel : ton GITHUB_TOKEN expire bientôt";
  private static final String TOKEN_SETTINGS_URL = "https://github.com/settings/personal-access-tokens";
  private static final DateTimeFormatter PARIS = DateTimeFormatter
    .ofPattern("dd/MM/yyyy HH:mm:ss", Locale.FRANCE)
    .withZone(ZoneId.of("Europe/Paris"));
  private static final Logger LOGGER = LoggerFactory.getLogger(GithubTokenReminderService.class);

  private final GithubTokenExpirationClient expirationClient;
  private final EmailQueueRepository emailQueueRepository;
  private final EmailQueueService emailQueueService;
  private final BrevoProperties brevoProperties;
  private final ObjectMapper objectMapper;
  private final Clock clock;

  public GithubTokenReminderService(
    GithubTokenExpirationClient expirationClient,
    EmailQueueRepository emailQueueRepository,
    EmailQueueService emailQueueService,
    BrevoProperties brevoProperties,
    ObjectMapper objectMapper,
    Clock clock
  ) {
    this.expirationClient = expirationClient;
    this.emailQueueRepository = emailQueueRepository;
    this.emailQueueService = emailQueueService;
    this.brevoProperties = brevoProperties;
    this.objectMapper = objectMapper;
    this.clock = clock;
  }

  @Scheduled(cron = "${app.github-token-reminder.cron:0 5 2 * * *}", zone = "UTC")
  public void remindIfDue() {
    try {
      queueIfDue();
    } catch (RuntimeException exception) {
      LOGGER.warn("GitHub token reminder skipped ({})", exception.getClass().getSimpleName());
    }
  }

  void queueIfDue() {
    Optional<Instant> expiration = expirationClient.currentExpiration();
    if (expiration.isEmpty() || !isReminderDay(expiration.get())) {
      return;
    }

    String owner = brevoProperties.getContactToEmail();
    if (owner.isEmpty() || !owner.contains("@")) {
      LOGGER.warn("GitHub token reminder skipped: CONTACT_TO_EMAIL is not configured");
      return;
    }

    Instant startOfToday = todayUtc().atStartOfDay(ZoneOffset.UTC).toInstant();
    if (emailQueueRepository.existsByRecipientAndSubjectAndCreatedAtGreaterThanEqual(owner, SUBJECT, startOfToday)) {
      return;
    }

    String text = message(expiration.get());
    EmailQueue email = emailQueueService.enqueue(
      new EmailMessage(owner, SUBJECT, objectMapper.writeValueAsString(
        new BrevoTemplatePayload(0, "", Map.of(), text)
      ), false),
      EmailChannel.BREVO
    );
    emailQueueService.requestDelivery(email.getId());
  }

  private LocalDate todayUtc() {
    return Instant.now(clock).atZone(ZoneOffset.UTC).toLocalDate();
  }

  private boolean isReminderDay(Instant expiration) {
    LocalDate today = todayUtc();
    LocalDate reminderDay = expiration.atZone(ZoneOffset.UTC).toLocalDate().minusDays(1);
    return today.equals(reminderDay);
  }

  private static String message(Instant expiration) {
    return """
      Salut,

      Petit rappel sympa : le jeton GitHub (GITHUB_TOKEN) utilisé pour le portfolio va expirer demain.

      Date et heure d'expiration prévues : %s (fuseau Europe/Paris, format jj/mm/aaaa et hh:mm:ss).

      Quand tu as cinq minutes, tu peux en générer un nouveau ici :
      %s

      Ensuite, pense à mettre à jour la variable sur ton hébergement et ton fichier .env local, pour éviter une coupure des stats ou des dates des projets.

      Merci et bonne journée !
      """.formatted(PARIS.format(expiration), TOKEN_SETTINGS_URL);
  }
}
