package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.EmailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class SmtpEmailSender implements EmailSender {

  private final JavaMailSender mailSender;
  private final EmailProperties emailProperties;

  public SmtpEmailSender(JavaMailSender mailSender, EmailProperties emailProperties) {
    this.mailSender = mailSender;
    this.emailProperties = emailProperties;
  }

  @Override
  public void send(EmailMessage email) {
    if (email.html()) {
      sendHtml(email);
      return;
    }

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(emailProperties.getFrom());
    message.setTo(email.recipient());
    message.setSubject(email.subject());
    message.setText(email.body());

    mailSender.send(message);
  }

  private void sendHtml(EmailMessage email) {
    MimeMessage message = mailSender.createMimeMessage();
    try {
      MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
      helper.setFrom(emailProperties.getFrom());
      helper.setTo(email.recipient());
      helper.setSubject(email.subject());
      helper.setText(email.body(), true);
    } catch (MessagingException exception) {
      throw new MailPreparationException("Could not prepare HTML email", exception);
    }
    mailSender.send(message);
  }
}
