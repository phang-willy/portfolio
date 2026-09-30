package com.phangwilly.portfolio.dto;

public record GithubStatsResponse(
  int contributionsAllTime,
  int repositoriesAffiliated,
  int currentStreakDays,
  int longestStreakDays
) {}
