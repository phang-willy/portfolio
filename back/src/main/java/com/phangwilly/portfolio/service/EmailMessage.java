package com.phangwilly.portfolio.service;

public record EmailMessage(String recipient, String subject, String body, boolean html) {

  public EmailMessage(String recipient, String subject, String body) {
    this(recipient, subject, body, false);
  }
}
