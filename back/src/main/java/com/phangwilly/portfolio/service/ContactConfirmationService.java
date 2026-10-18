package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.BrevoProperties;
import com.phangwilly.portfolio.enums.EmailChannel;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.ContactHistory;
import com.phangwilly.portfolio.model.EmailQueue;
import com.phangwilly.portfolio.repository.ContactHistoryRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

/** Queues the visitor Brevo confirmation after the contact row exists. */
@Service
public class ContactConfirmationService {

  static final String ACTOR = "Brevo";

  private final EmailQueueService emailQueueService;
  private final ContactHistoryRepository historyRepository;
  private final BrevoProperties properties;
  private final ObjectMapper objectMapper;

  public ContactConfirmationService(
    EmailQueueService emailQueueService,
    ContactHistoryRepository historyRepository,
    BrevoProperties properties,
    ObjectMapper objectMapper
  ) {
    this.emailQueueService = emailQueueService;
    this.historyRepository = historyRepository;
    this.properties = properties;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public void queue(Contact contact, Map<String, String> brevoParams) {
    Map<String, String> params = confirmationParams(contact, brevoParams);
    String subject = subject(params, contact);
    BrevoTemplatePayload payload = new BrevoTemplatePayload(
      properties.contactTemplateIdValue(),
      contact.getFirstname(),
      params
    );
    EmailQueue email = emailQueueService.enqueue(
      new EmailMessage(contact.getEmail(), subject, objectMapper.writeValueAsString(payload), false),
      EmailChannel.BREVO
    );
    historyRepository.save(ContactHistory.confirmation(
      contact,
      subject,
      "Confirmation au visiteur.",
      ACTOR,
      email
    ));
    emailQueueService.requestDelivery(email.getId());
  }

  private static Map<String, String> confirmationParams(Contact contact, Map<String, String> brevoParams) {
    Map<String, String> params = new LinkedHashMap<>();
    if (brevoParams != null) {
      params.putAll(brevoParams);
    }
    params.put("FIRSTNAME", text(contact.getFirstname()));
    params.put("LASTNAME", text(contact.getLastname()));
    params.put("EMAIL", text(contact.getEmail()));
    params.put("PHONENUMBER", text(contact.getPhone()));
    params.put("COMPANY", text(contact.getCompany()));
    params.put("TITLE", text(contact.getSubject()));
    params.put("MESSAGE", text(contact.getMessage()));
    return Map.copyOf(params);
  }

  private static String subject(Map<String, String> params, Contact contact) {
    String object = params.get("OBJECT");
    if (object != null && !object.isBlank()) {
      return object;
    }
    String title = contact.getSubject();
    return title == null || title.isBlank() ? "Confirmation de contact" : title;
  }

  private static String text(String value) {
    return value == null ? "" : value;
  }
}
