package com.phangwilly.portfolio.service;

import java.util.Optional;

public interface GithubRepoDatesClient {

  Optional<GithubRepoDates> fetch(GithubRepoRef repo);
}
