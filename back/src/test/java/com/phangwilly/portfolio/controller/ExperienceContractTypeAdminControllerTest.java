package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceContractTypeDeleteRequest;
import com.phangwilly.portfolio.dto.ExperienceContractTypeLocaleRequest;
import com.phangwilly.portfolio.service.ExperienceContractTypeAdminService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class ExperienceContractTypeAdminControllerTest {

  private static final UUID CONTRACT_TYPE_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
  private static final ExperienceContractTypeAdminDetail DETAIL = new ExperienceContractTypeAdminDetail(
    CONTRACT_TYPE_ID,
    "alternance",
    "alternance-fr",
    "work-study-en",
    new ExperienceContractTypeLocaleRequest("Alternance"),
    new ExperienceContractTypeLocaleRequest("Work-study")
  );

  @Mock
  private ExperienceContractTypeAdminService service;

  private ExperienceContractTypeAdminController controller;

  @BeforeEach
  void setUp() {
    controller = new ExperienceContractTypeAdminController(service);
  }

  @Test
  void createContractTypeSkipsServiceWhenHoneypotIsFilled() {
    var request = sampleRequest("https://spam.example");

    var response = controller.createContractType(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(service);
  }

  @Test
  void createContractTypeDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = sampleRequest(null);
    when(service.createContractType(request)).thenReturn(DETAIL);

    var response = controller.createContractType(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(DETAIL);
    verify(service).createContractType(request);
  }

  @Test
  void updateContractTypeSkipsServiceWhenHoneypotIsFilled() {
    var request = sampleRequest("bot");

    var response = controller.updateContractType(CONTRACT_TYPE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(service);
  }

  @Test
  void updateContractTypeDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = sampleRequest("");
    when(service.updateContractType(CONTRACT_TYPE_ID, request)).thenReturn(DETAIL);

    var response = controller.updateContractType(CONTRACT_TYPE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(DETAIL);
    verify(service).updateContractType(CONTRACT_TYPE_ID, request);
  }

  @Test
  void deleteContractTypeSkipsServiceWhenHoneypotIsFilled() {
    var request = new ExperienceContractTypeDeleteRequest("spam");

    var response = controller.deleteContractType(CONTRACT_TYPE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Experience contract type deleted");
    verifyNoInteractions(service);
  }

  @Test
  void deleteContractTypeDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new ExperienceContractTypeDeleteRequest(null);

    var response = controller.deleteContractType(CONTRACT_TYPE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Experience contract type deleted");
    verify(service).deleteContractType(CONTRACT_TYPE_ID);
  }

  @Test
  void deactivateContractTypeSkipsServiceWhenHoneypotIsFilled() {
    var request = new ExperienceContractTypeDeleteRequest("spam");

    var response = controller.deactivateContractType(CONTRACT_TYPE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    verifyNoInteractions(service);
  }

  @Test
  void deactivateContractTypeDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new ExperienceContractTypeDeleteRequest("");

    var response = controller.deactivateContractType(CONTRACT_TYPE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Experience contract type deactivated");
    verify(service).deactivateContractType(CONTRACT_TYPE_ID);
  }

  private static ExperienceContractTypeAdminRequest sampleRequest(String website) {
    return new ExperienceContractTypeAdminRequest(
      new ExperienceContractTypeLocaleRequest("Alternance"),
      new ExperienceContractTypeLocaleRequest("Work-study"),
      website
    );
  }
}
