package com.phangwilly.portfolio.service;

import java.time.Instant;
import java.util.Optional;

public interface GithubTokenExpirationClient {

  Optional<Instant> currentExpiration();
}
