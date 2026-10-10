package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ContactAdminListItem;
import com.phangwilly.portfolio.dto.ContactRequest;
import com.phangwilly.portfolio.event.ContactChangedEvent;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.repository.ContactRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Persists a public contact and publishes the existing realtime event after commit. */
@Service
public class ContactService {

  private final ContactRepository contactRepository;
  private final ContactConfirmationService contactConfirmationService;
  private final ApplicationEventPublisher eventPublisher;

  public ContactService(
    ContactRepository contactRepository,
    ContactConfirmationService contactConfirmationService,
    ApplicationEventPublisher eventPublisher
  ) {
    this.contactRepository = contactRepository;
    this.contactConfirmationService = contactConfirmationService;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public Contact submit(ContactRequest request) {
    Contact saved = receive(new Contact(
      request.firstName(),
      request.lastName(),
      request.email(),
      request.phone(),
      request.company(),
      request.title(),
      request.message()
    ));
    contactConfirmationService.queue(saved, request.brevoParams());
    return saved;
  }

  @Transactional
  public Contact receive(Contact contact) {
    Contact saved = contactRepository.saveAndFlush(contact);
    eventPublisher.publishEvent(new ContactChangedEvent(ContactAdminListItem.from(saved)));
    return saved;
  }
}
