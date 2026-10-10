package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ExperienceAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceAdminListItem;
import com.phangwilly.portfolio.dto.ExperienceAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceDeleteRequest;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.ExperienceAdminService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/experience")
public class ExperienceAdminController {

  private static final String DELETED_MESSAGE = "Experience deleted";

  private final ExperienceAdminService experienceAdminService;

  public ExperienceAdminController(ExperienceAdminService experienceAdminService) {
    this.experienceAdminService = experienceAdminService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<ExperienceAdminListItem>> getExperiences(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(experienceAdminService.getExperiences(page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ExperienceAdminDetail>> getExperience(@PathVariable UUID id) {
    return ApiResponses.ok(experienceAdminService.getExperience(id));
  }

  @PostMapping
  public ResponseEntity<ApiResponse<ExperienceAdminDetail>> createExperience(
    @Valid @RequestBody ExperienceAdminRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(experienceAdminService.createExperience(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<ExperienceAdminDetail>> updateExperience(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceAdminRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(experienceAdminService.updateExperience(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteExperience(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(DELETED_MESSAGE);
    }

    experienceAdminService.deleteExperience(id);
    return ApiResponses.okMessage(DELETED_MESSAGE);
  }

  @PutMapping("/deactivate/{id}")
  public ResponseEntity<ApiResponse<Void>> deactivateExperience(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok();
    }

    experienceAdminService.deactivateExperience(id);
    return ApiResponses.okMessage("Experience deactivated");
  }

  @PutMapping("/reactivate/{id}")
  public ResponseEntity<ApiResponse<Void>> reactivateExperience(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok();
    }

    experienceAdminService.reactivateExperience(id);
    return ApiResponses.okMessage("Experience reactivated");
  }
}
