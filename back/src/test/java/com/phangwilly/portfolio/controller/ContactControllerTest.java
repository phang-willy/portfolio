package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.phangwilly.portfolio.dto.ContactRequest;
import com.phangwilly.portfolio.service.ContactService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class ContactControllerTest {

  @Mock private ContactService contactService;

  private ContactController controller;

  @BeforeEach
  void setUp() {
    controller = new ContactController(contactService);
  }

  @Test
  void createStoresContactAndReturnsConfirmationWithoutPayload() {
    ContactRequest request = validRequest("");

    var response = controller.create(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().success()).isTrue();
    assertThat(response.getBody().data()).isNull();
    verify(contactService).submit(request);
  }

  @Test
  void createDropsHoneypotWithoutStoring() {
    var response = controller.create(validRequest("https://spam.example"));

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(contactService);
  }

  private static ContactRequest validRequest(String website) {
    return new ContactRequest(
      "Léa", "Martin", "lea@example.test", "0612345678", "Atelier", "Projet", "Bonjour", website
    );
  }
}
