package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.model.AuditableEntity;
import com.phangwilly.portfolio.model.Contact;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class ContactReplyEmailFactoryTest {

  private final ContactReplyEmailFactory factory = new ContactReplyEmailFactory("Portfolio", "Europe/Paris");

  @Test
  void createsBrandedHtmlWithExactSubjectAndAllOriginalDetails() {
    Contact contact = contact("Création de site", "Bonjour,\r\nParlons de mon projet.");

    EmailMessage email = factory.create(contact, "Merci pour votre demande.\nVoici notre proposition.");

    assertThat(email.recipient()).isEqualTo("lea@example.test");
    assertThat(email.subject()).isEqualTo("Portfolio - SUITE : Création de site");
    assertThat(email.html()).isTrue();
    assertThat(email.body()).contains(
      "lang=\"fr\"", "Léa", "Martin", "lea@example.test", "+33 6 12 34 56 78", "Atelier &amp; Co",
      "Création de site", "21 septembre 2026 à 14:30", "Bonjour,<br>Parlons de mon projet.",
      "Merci pour votre demande.<br>Voici notre proposition."
    );
    assertThat(email.body()).contains("font-weight:bold", "font-weight:normal");
    assertThat(email.body().indexOf(">Objet</p>"))
      .isGreaterThan(-1)
      .isLessThan(email.body().indexOf(">Message</p>"));
  }

  @Test
  void escapesVisitorAndReplyContentInsteadOfAcceptingHtml() {
    Contact contact = contact("<script>alert('subject')</script>", "<img src=x onerror=alert(1)>");

    EmailMessage email = factory.create(contact, "<a href='https://untrusted.test'>Lien</a> & texte");

    assertThat(email.body()).doesNotContain("<script>", "<img ", "<a href=")
      .contains("&lt;script&gt;", "&lt;img", "&lt;a", "&amp; texte");
  }

  @Test
  void handlesMissingOptionalFieldsAndKeepsLongSubjects() {
    Contact contact = new Contact("Léa", "Martin", "lea@example.test", null, null, "s".repeat(255), "Question");
    setCreatedAt(contact);

    EmailMessage email = factory.create(contact, "Réponse");

    assertThat(email.body()).contains("Non renseigné").doesNotContain(">null<");
    assertThat(email.subject()).isEqualTo("Portfolio - SUITE : " + "s".repeat(255));
  }

  @Test
  void stripsHeaderLineBreaksAndUsesFallbackBrand() {
    Contact contact = contact("Question\r\nBcc: injected@example.test", "Question");
    ContactReplyEmailFactory fallback = new ContactReplyEmailFactory(" ", "UTC");

    EmailMessage email = fallback.create(contact, "Réponse");

    assertThat(email.subject()).startsWith("Portfolio - SUITE : ").doesNotContain("\r", "\n");
    assertThat(email.body()).contains("21 septembre 2026 à 12:30");
  }

  private static Contact contact(String subject, String message) {
    Contact contact = new Contact(
      "Léa", "Martin", "lea@example.test", "+33 6 12 34 56 78", "Atelier & Co", subject, message
    );
    setCreatedAt(contact);
    return contact;
  }

  private static void setCreatedAt(Contact contact) {
    ReflectionTestUtils.setField(contact, AuditableEntity.class, "createdAt", Instant.parse("2026-09-21T12:30:00Z"), Instant.class);
  }
}
