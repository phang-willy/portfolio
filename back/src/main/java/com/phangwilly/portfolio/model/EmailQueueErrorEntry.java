package com.phangwilly.portfolio.model;

import java.time.Instant;

public record EmailQueueErrorEntry(String at, String message) {

  public EmailQueueErrorEntry(Instant at, String message) {
    this(at.toString(), message);
  }
}
