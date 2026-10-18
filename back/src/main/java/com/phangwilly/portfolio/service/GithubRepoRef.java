package com.phangwilly.portfolio.service;

import java.util.Locale;

public record GithubRepoRef(String owner, String repo) {

  public String key() {
    return owner.toLowerCase(Locale.ROOT) + "/" + repo.toLowerCase(Locale.ROOT);
  }
}
