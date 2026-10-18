package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.GithubStatsResponse;
import com.phangwilly.portfolio.service.GithubStatsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/github-stats")
public class GithubStatsController {

  private final GithubStatsService githubStatsService;

  public GithubStatsController(GithubStatsService githubStatsService) {
    this.githubStatsService = githubStatsService;
  }

  @GetMapping
  public ResponseEntity<ApiResponse<GithubStatsResponse>> get() {
    return ApiResponses.ok(githubStatsService.current());
  }
}
