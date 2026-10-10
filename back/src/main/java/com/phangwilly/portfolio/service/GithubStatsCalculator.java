package com.phangwilly.portfolio.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class GithubStatsCalculator {

  private GithubStatsCalculator() {}

  static List<Instant[]> yearChunks(Instant createdAt, Instant until) {
    List<Instant[]> chunks = new ArrayList<>();
    int startYear = createdAt.atZone(ZoneOffset.UTC).getYear();
    int endYear = until.atZone(ZoneOffset.UTC).getYear();
    for (int year = startYear; year <= endYear; year++) {
      Instant from = year == startYear
        ? createdAt
        : LocalDate.of(year, 1, 1).atStartOfDay(ZoneOffset.UTC).toInstant();
      Instant to = year == endYear
        ? until
        : LocalDate.of(year, 12, 31).atTime(23, 59, 59, 999_000_000).toInstant(ZoneOffset.UTC);
      if (!from.isAfter(to)) {
        chunks.add(new Instant[] {from, to});
      }
    }
    return chunks;
  }

  static int currentStreakDays(Set<String> activeDays, LocalDate today) {
    LocalDate day = activeDays.contains(today.toString()) ? today : today.minusDays(1);
    int streak = 0;
    while (activeDays.contains(day.toString())) {
      streak++;
      day = day.minusDays(1);
    }
    return streak;
  }

  static int longestStreakDays(Set<String> activeDays) {
    List<String> sorted = activeDays.stream().sorted().toList();
    if (sorted.isEmpty()) {
      return 0;
    }
    int best = 1;
    int run = 1;
    for (int index = 1; index < sorted.size(); index++) {
      LocalDate previous = LocalDate.parse(sorted.get(index - 1));
      LocalDate current = LocalDate.parse(sorted.get(index));
      if (current.equals(previous.plusDays(1))) {
        run++;
        best = Math.max(best, run);
      } else {
        run = 1;
      }
    }
    return best;
  }

  static void addDay(Map<String, Integer> totals, String date, int count) {
    if (date == null || date.isBlank()) {
      return;
    }
    totals.merge(date, count, Integer::sum);
  }
}
