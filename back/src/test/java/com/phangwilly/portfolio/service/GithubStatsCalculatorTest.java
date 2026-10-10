package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

class GithubStatsCalculatorTest {

  @Test
  void currentStreakIncludesTodayAndFallsBackToYesterday() {
    LocalDate today = LocalDate.parse("2026-09-30");

    assertThat(GithubStatsCalculator.currentStreakDays(
      Set.of("2026-09-28", "2026-09-29", "2026-09-30"),
      today
    )).isEqualTo(3);
    assertThat(GithubStatsCalculator.currentStreakDays(
      Set.of("2026-09-28", "2026-09-29"),
      today
    )).isEqualTo(2);
    assertThat(GithubStatsCalculator.currentStreakDays(Set.of("2026-09-20"), today)).isZero();
  }

  @Test
  void longestStreakStopsAtAGap() {
    assertThat(GithubStatsCalculator.longestStreakDays(Set.of(
      "2026-01-01", "2026-01-02", "2026-01-04", "2026-01-05", "2026-01-06"
    ))).isEqualTo(3);
  }

  @Test
  void yearChunksCoverEachCalendarYearOnce() {
    assertThat(GithubStatsCalculator.yearChunks(
      Instant.parse("2024-06-01T00:00:00Z"),
      Instant.parse("2026-02-01T00:00:00Z")
    )).hasSize(3);
  }
}
