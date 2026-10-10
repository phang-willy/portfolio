package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.BrevoProperties;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.ContactHistory;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.ContactHistoryRepository;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

/** Tells CONTACT_TO_EMAIL, by SMTP, that the visitor Brevo confirmation failed. */
@Service
public class BrevoDeliveryFailureNotifier {

  static final String ACTOR = "SMTP";

  private static final Logger LOGGER = LoggerFactory.getLogger(BrevoDeliveryFailureNotifier.class);
  private static final int MESSAGE_MAX = 2_000;

  private final EmailQueueService emailQueueService;
  private final ContactHistoryRepository historyRepository;
  private final BrevoProperties properties;

  public BrevoDeliveryFailureNotifier(
    @Lazy EmailQueueService emailQueueService,
    ContactHistoryRepository historyRepository,
    BrevoProperties properties
  ) {
    this.emailQueueService = emailQueueService;
    this.historyRepository = historyRepository;
    this.properties = properties;
  }

  public void notify(EmailQueue failedEmail, String error) {
    String owner = properties.getContactToEmail();
    if (owner.isEmpty() || !owner.contains("@")) {
      LOGGER.warn("Brevo confirmation failed and CONTACT_TO_EMAIL is not configured");
      return;
    }

    Optional<Contact> contact = historyRepository.findContactByEmailQueueId(failedEmail.getId());
    if (contact == null || contact.isEmpty()) {
      LOGGER.warn("Brevo email {} failed with no linked contact; no SMTP notice queued", failedEmail.getId());
      return;
    }
    String subject = "Demande de contact non envoyée par Brevo";
    EmailQueue alert = emailQueueService.enqueue(new EmailMessage(owner, subject, body(contact.get(), failedEmail, error), false));
    contact.ifPresent(saved -> historyRepository.save(ContactHistory.confirmation(
      saved,
      subject,
      "La confirmation Brevo n'a pas pu être envoyée. Un e-mail SMTP a été mis en file.",
      ACTOR,
      alert
    )));
    emailQueueService.requestDelivery(alert.getId());
  }

  private static String body(Contact saved, EmailQueue failedEmail, String error) {
    String visitor = saved.getFirstname() + " " + saved.getLastname() + " <" + saved.getEmail() + ">";
    String title = saved.getSubject() == null || saved.getSubject().isBlank()
      ? failedEmail.getSubject()
      : saved.getSubject();
    String phone = blank(saved.getPhone());
    String company = blank(saved.getCompany());
    String message = clip(saved.getMessage());

    return """
      Une demande de contact n'a pas pu être envoyée par Brevo.

      Visiteur : %s
      Sujet : %s
      Téléphone : %s
      Société : %s
      Erreur : %s

      Message :
      %s

      Le renvoi depuis la file d'e-mails relance la procédure Brevo d'origine.
      """.formatted(visitor, blank(title), phone, company, blank(error), message);
  }

  private static String blank(String value) {
    return value == null || value.isBlank() ? "—" : value;
  }

  private static String clip(String value) {
    if (value == null) {
      return "";
    }
    if (value.length() <= MESSAGE_MAX) {
      return value;
    }
    return value.substring(0, MESSAGE_MAX) + "…";
  }
}
