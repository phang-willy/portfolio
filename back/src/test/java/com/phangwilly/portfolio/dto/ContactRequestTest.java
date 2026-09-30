package com.phangwilly.portfolio.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class ContactRequestTest {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
  private final JsonMapper json = JsonMapper.builder().build();

  @Test
  void acceptsAValidPublicSubmission() {
    assertThat(validator.validate(valid("Bonjour", "lea@example.test", "0612345678"))).isEmpty();
  }

  @Test
  void rejectsAnInvalidEmail() {
    assertThat(validator.validate(valid("Bonjour", "not-an-email", "0612345678"))).isNotEmpty();
  }

  @Test
  void rejectsABlankMessage() {
    assertThat(validator.validate(valid("   ", "lea@example.test", "0612345678"))).isNotEmpty();
  }

  @Test
  void rejectsAMessageBeyondTheSharedLimit() {
    ContactRequest request = valid("m".repeat(ContactRequest.MESSAGE_MAX + 1), "lea@example.test", "0612345678");

    assertThat(validator.validate(request)).isNotEmpty();
  }

  @Test
  void rejectsAPhoneBeyondTheSharedLimit() {
    ContactRequest request = valid("Bonjour", "lea@example.test", "1".repeat(ContactRequest.PHONE_MAX + 1));

    assertThat(validator.validate(request)).isNotEmpty();
  }

  @Test
  void ignoresAdministrativeFieldsFromThePublicJson() throws Exception {
    String body = """
      {
        "firstName": "Léa",
        "lastName": "Martin",
        "email": "lea@example.test",
        "phone": "0612345678",
        "title": "Projet",
        "message": "Bonjour",
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "status": "REPLIED",
        "createdAt": "2026-09-30T12:00:00Z",
        "updatedAt": "2026-09-30T12:00:00Z",
        "readAt": "2026-09-30T12:00:00Z",
        "repliedAt": "2026-09-30T12:00:00Z",
        "locale": "en"
      }
      """;

    ContactRequest request = json.readValue(body, ContactRequest.class);

    assertThat(validator.validate(request)).isEmpty();
    assertThat(request.firstName()).isEqualTo("Léa");
    assertThat(request.title()).isEqualTo("Projet");
    assertThat(request.message()).isEqualTo("Bonjour");
    assertThat(request.website()).isNull();
    assertThat(request.brevoParams()).isEmpty();
  }

  @Test
  void keepsTemplateParamsAndDropsKeysThatAreNotBrevoNames() throws Exception {
    String body = """
      {
        "firstName": "Léa",
        "lastName": "Martin",
        "email": "lea@example.test",
        "phone": "0612345678",
        "title": "Projet",
        "message": "Bonjour",
        "brevoParams": {
          "BODY_LINE1": "Bonjour, Bonsoir",
          "not a key": "no",
          "FIRSTNAME": "spoof"
        }
      }
      """;

    ContactRequest request = json.readValue(body, ContactRequest.class);

    assertThat(request.brevoParams()).containsEntry("BODY_LINE1", "Bonjour, Bonsoir");
    assertThat(request.brevoParams()).containsEntry("FIRSTNAME", "spoof");
    assertThat(request.brevoParams()).doesNotContainKey("not a key");
  }

  private static ContactRequest valid(String message, String email, String phone) {
    return new ContactRequest("Léa", "Martin", email, phone, "Atelier", "Projet", message, "");
  }
}
