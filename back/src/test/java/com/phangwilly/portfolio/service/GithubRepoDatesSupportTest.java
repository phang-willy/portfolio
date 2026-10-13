package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class GithubRepoDatesSupportTest {

  @Test
  void parsePrefersTheSourceLinkAndStripsGitSuffix() {
    Optional<GithubRepoRef> ref = GithubRepoUrls.fromLinks(
      "https://github.com/Phang-Willy/Portfolio.git",
      "https://github.com/other/site"
    );

    assertThat(ref).contains(new GithubRepoRef("Phang-Willy", "Portfolio"));
  }

  @Test
  void parseFallsBackToAGithubProductionLink() {
    Optional<GithubRepoRef> ref = GithubRepoUrls.fromLinks(
      "https://example.com",
      "https://www.github.com/phang-willy/geolock/tree/main"
    );

    assertThat(ref).contains(new GithubRepoRef("phang-willy", "geolock"));
  }

  @Test
  void latestPushUsesAnyBranchAndIgnoresRepoMetadata() {
    Instant pushedAt = Instant.parse("2026-10-10T16:21:58Z");
    Instant updatedAt = Instant.parse("2026-04-11T11:04:19Z");

    assertThat(GithubApiRepoDatesClient.latestPushAt(pushedAt, updatedAt)).isEqualTo(pushedAt);
    assertThat(GithubApiRepoDatesClient.latestPushAt(null, updatedAt)).isEqualTo(updatedAt);
  }

  @Test
  void newerKeepsTheLatestInstant() {
    Instant older = Instant.parse("2026-01-01T00:00:00Z");
    Instant newer = Instant.parse("2026-06-01T00:00:00Z");

    assertThat(GithubDateSelection.newer(older, newer)).isEqualTo(newer);
    assertThat(GithubDateSelection.newer(newer, older)).isEqualTo(newer);
    assertThat(GithubDateSelection.newer(null, older)).isEqualTo(older);
    assertThat(GithubDateSelection.movedForward(older, newer)).isTrue();
    assertThat(GithubDateSelection.movedForward(null, newer)).isFalse();
    assertThat(GithubDateSelection.movedForward(newer, older)).isFalse();
  }
}
