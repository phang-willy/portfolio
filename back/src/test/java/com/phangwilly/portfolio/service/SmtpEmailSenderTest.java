package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.EmailProperties;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import java.util.Properties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@ExtendWith(MockitoExtension.class)
class SmtpEmailSenderTest {

  @Mock
  private JavaMailSender mailSender;

  private SmtpEmailSender sender;

  @BeforeEach
  void setUp() {
    EmailProperties properties = new EmailProperties();
    properties.setFrom("portfolio@example.com");
    sender = new SmtpEmailSender(mailSender, properties);
  }

  @Test
  void sendBuildsUtf8HtmlMimeMessage() throws Exception {
    MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
    when(mailSender.createMimeMessage()).thenReturn(message);

    sender.send(new EmailMessage("visitor@example.com", "Portfolio - SUITE : Échange", "<p>Réponse</p>", true));

    verify(mailSender).send(message);
    message.saveChanges();
    assertThat(message.isMimeType("text/html")).isTrue();
    assertThat(message.getContentType()).containsIgnoringCase("charset=UTF-8");
    assertThat(message.getContent()).isEqualTo("<p>Réponse</p>");
    assertThat(message.getSubject()).isEqualTo("Portfolio - SUITE : Échange");
    assertThat(message.getAllRecipients()[0].toString()).isEqualTo("visitor@example.com");
    assertThat(message.getFrom()[0].toString()).isEqualTo("portfolio@example.com");
  }

  @Test
  void sendLeavesExistingEmailsInPlainTextEvenWithHtmlLikeContent() {
    sender.send(new EmailMessage("visitor@example.com", "Verify your email", "Token <secret>"));

    ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(mailSender).send(captor.capture());
    assertThat(captor.getValue().getText()).isEqualTo("Token <secret>");
    assertThat(captor.getValue().getFrom()).isEqualTo("portfolio@example.com");
    assertThat(captor.getValue().getTo()).containsExactly("visitor@example.com");
  }
}
