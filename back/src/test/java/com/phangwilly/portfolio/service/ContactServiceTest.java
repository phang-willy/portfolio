package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ContactRequest;
import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.event.ContactChangedEvent;
import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.repository.ContactRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class ContactServiceTest {

  @Mock private ContactRepository contacts;
  @Mock private ContactConfirmationService confirmations;
  @Mock private ApplicationEventPublisher events;

  private ContactService service;

  @BeforeEach
  void setUp() {
    service = new ContactService(contacts, confirmations, events);
    when(contacts.saveAndFlush(any(Contact.class))).thenAnswer(invocation -> invocation.getArgument(0));
  }

  @Test
  void submitPersistsTrimmedReceivedContactAndPublishesChange() {
    ContactRequest request = new ContactRequest(
      " Léa ", " Martin ", " lea@example.test ", " 06 12 34 56 78 ",
      "   ", " Projet ", "  Bonjour  ", null
    );

    Contact saved = service.submit(request);

    assertThat(saved.getFirstname()).isEqualTo("Léa");
    assertThat(saved.getLastname()).isEqualTo("Martin");
    assertThat(saved.getEmail()).isEqualTo("lea@example.test");
    assertThat(saved.getPhone()).isEqualTo("06 12 34 56 78");
    assertThat(saved.getCompany()).isNull();
    assertThat(saved.getSubject()).isEqualTo("Projet");
    assertThat(saved.getMessage()).isEqualTo("Bonjour");
    assertThat(saved.getStatus()).isEqualTo(ContactStatus.RECEIVED);
    assertThat(saved.getFirstReadAt()).isNull();
    assertThat(saved.getLastReadAt()).isNull();
    verify(events).publishEvent(any(ContactChangedEvent.class));
    verify(confirmations).queue(saved, request.brevoParams());
  }

  @Test
  void submitDoesNotAcceptAnAdministrativeStatus() {
    service.submit(new ContactRequest(
      "Léa", "Martin", "lea@example.test", "0612345678", "Atelier", "Projet", "Bonjour", null
    ));

    ArgumentCaptor<Contact> saved = ArgumentCaptor.forClass(Contact.class);
    verify(contacts).saveAndFlush(saved.capture());
    assertThat(saved.getValue().getStatus()).isEqualTo(ContactStatus.RECEIVED);
  }
}
