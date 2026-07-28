package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ExperienceAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceDeleteRequest;
import com.phangwilly.portfolio.dto.ExperienceLocaleRequest;
import com.phangwilly.portfolio.service.ExperienceAdminService;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class ExperienceAdminControllerTest {

  private static final UUID EXPERIENCE_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
  private static final ExperienceAdminDetail DETAIL = new ExperienceAdminDetail(
    EXPERIENCE_ID,
    "Logistib",
    (short) 2020,
    (short) 2022,
    null,
    "logistib-integrateur-web-2020-2022-fr",
    "logistib-web-integrator-2020-2022-en",
    new ExperienceLocaleRequest("Intégrateur Web", "Résumé", "<p>FR</p>"),
    new ExperienceLocaleRequest("Web integrator", "Summary", "<p>EN</p>")
  );

  @Mock
  private ExperienceAdminService experienceAdminService;

  private ExperienceAdminController controller;

  @BeforeEach
  void setUp() {
    controller = new ExperienceAdminController(experienceAdminService);
  }

  @Test
  void createExperienceSkipsServiceWhenHoneypotIsFilled() {
    var request = sampleRequest("https://spam.example");

    var response = controller.createExperience(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(experienceAdminService);
  }

  @Test
  void createExperienceDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = sampleRequest(null);
    when(experienceAdminService.createExperience(request)).thenReturn(DETAIL);

    var response = controller.createExperience(request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(DETAIL);
    verify(experienceAdminService).createExperience(request);
  }

  @Test
  void updateExperienceSkipsServiceWhenHoneypotIsFilled() {
    var request = sampleRequest("bot");

    var response = controller.updateExperience(EXPERIENCE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isNull();
    verifyNoInteractions(experienceAdminService);
  }

  @Test
  void updateExperienceDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = sampleRequest("");
    when(experienceAdminService.updateExperience(EXPERIENCE_ID, request)).thenReturn(DETAIL);

    var response = controller.updateExperience(EXPERIENCE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().data()).isEqualTo(DETAIL);
    verify(experienceAdminService).updateExperience(EXPERIENCE_ID, request);
  }

  @Test
  void deleteExperienceSkipsServiceWhenHoneypotIsFilled() {
    var request = new ExperienceDeleteRequest("spam");

    var response = controller.deleteExperience(EXPERIENCE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Experience deleted");
    verifyNoInteractions(experienceAdminService);
  }

  @Test
  void deleteExperienceDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new ExperienceDeleteRequest(null);

    var response = controller.deleteExperience(EXPERIENCE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Experience deleted");
    verify(experienceAdminService).deleteExperience(EXPERIENCE_ID);
  }

  @Test
  void deactivateExperienceSkipsServiceWhenHoneypotIsFilled() {
    var request = new ExperienceDeleteRequest("spam");

    var response = controller.deactivateExperience(EXPERIENCE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    verifyNoInteractions(experienceAdminService);
  }

  @Test
  void deactivateExperienceDelegatesToServiceWhenHoneypotIsEmpty() {
    var request = new ExperienceDeleteRequest("");

    var response = controller.deactivateExperience(EXPERIENCE_ID, request);

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody()).isNotNull();
    assertThat(response.getBody().message()).isEqualTo("Experience deactivated");
    verify(experienceAdminService).deactivateExperience(EXPERIENCE_ID);
  }

  private static ExperienceAdminRequest sampleRequest(String website) {
    return new ExperienceAdminRequest(
      "Logistib",
      (short) 2020,
      (short) 2022,
      null,
      new ExperienceLocaleRequest("Intégrateur Web", "Résumé", "<p>FR</p>"),
      new ExperienceLocaleRequest("Web integrator", "Summary", "<p>EN</p>"),
      website
    );
  }
}
