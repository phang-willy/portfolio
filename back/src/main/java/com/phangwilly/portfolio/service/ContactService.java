package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ContactAdminListItem;
import com.phangwilly.portfolio.event.ContactChangedEvent;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.repository.ContactRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Internal reception boundary, intentionally not exposed through a public controller. */
@Service
public class ContactService {

  private final ContactRepository contactRepository;
  private final ApplicationEventPublisher eventPublisher;

  public ContactService(ContactRepository contactRepository, ApplicationEventPublisher eventPublisher) {
    this.contactRepository = contactRepository;
    this.eventPublisher = eventPublisher;
  }

  @Transactional
  public Contact receive(Contact contact) {
    Contact saved = contactRepository.saveAndFlush(contact);
    eventPublisher.publishEvent(new ContactChangedEvent(ContactAdminListItem.from(saved)));
    return saved;
  }
}
