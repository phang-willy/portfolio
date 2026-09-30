package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.GithubStatsResponse;
import java.util.Optional;

public interface GithubStatsClient {

  Optional<GithubStatsResponse> fetch();
}
