package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.EmailProperties;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
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
    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(emailProperties.getFrom());
    message.setTo(email.recipient());
    message.setSubject(email.subject());
    message.setText(email.body());

    mailSender.send(message);
  }
}
