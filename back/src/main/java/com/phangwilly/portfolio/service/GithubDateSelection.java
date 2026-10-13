package com.phangwilly.portfolio.service;

import java.time.Instant;

/** Keeps the newer of the stored GitHub timestamp and the value just fetched. */
public final class GithubDateSelection {

  private GithubDateSelection() {
  }

  public static Instant newer(Instant stored, Instant incoming) {
    if (incoming == null) {
      return stored;
    }
    if (stored == null || incoming.isAfter(stored)) {
      return incoming;
    }
    return stored;
  }

  public static boolean movedForward(Instant stored, Instant incoming) {
    return incoming != null && stored != null && incoming.isAfter(stored);
  }
}
