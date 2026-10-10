package com.phangwilly.portfolio.service;

public interface BrevoTemplateMailer {

  void send(BrevoTemplatePayload payload, String recipientEmail, String subject);
}
