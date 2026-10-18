package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ExperienceResponse;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.service.ExperienceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/experience")
public class ExperienceController {

  private final ExperienceService experienceService;

  public ExperienceController(ExperienceService experienceService) {
    this.experienceService = experienceService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<ExperienceResponse>> getExperiences(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(experienceService.getExperiences(page, size));
  }
}
