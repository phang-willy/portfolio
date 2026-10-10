package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminDetail;
import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminListItem;
import com.phangwilly.portfolio.dto.ExperienceContractTypeAdminRequest;
import com.phangwilly.portfolio.dto.ExperienceContractTypeDeleteRequest;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.ExperienceContractTypeAdminService;
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
@RequestMapping("/api/admin/experience-contract-type")
public class ExperienceContractTypeAdminController {

  private static final String DELETED_MESSAGE = "Experience contract type deleted";

  private final ExperienceContractTypeAdminService service;

  public ExperienceContractTypeAdminController(ExperienceContractTypeAdminService service) {
    this.service = service;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<ExperienceContractTypeAdminListItem>> getContractTypes(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(service.getContractTypes(page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ExperienceContractTypeAdminDetail>> getContractType(
    @PathVariable UUID id
  ) {
    return ApiResponses.ok(service.getContractType(id));
  }

  @PostMapping
  public ResponseEntity<ApiResponse<ExperienceContractTypeAdminDetail>> createContractType(
    @Valid @RequestBody ExperienceContractTypeAdminRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(service.createContractType(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<ExperienceContractTypeAdminDetail>> updateContractType(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceContractTypeAdminRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(service.updateContractType(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteContractType(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceContractTypeDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(DELETED_MESSAGE);
    }

    service.deleteContractType(id);
    return ApiResponses.okMessage(DELETED_MESSAGE);
  }

  @PutMapping("/deactivate/{id}")
  public ResponseEntity<ApiResponse<Void>> deactivateContractType(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceContractTypeDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok();
    }

    service.deactivateContractType(id);
    return ApiResponses.okMessage("Experience contract type deactivated");
  }

  @PutMapping("/reactivate/{id}")
  public ResponseEntity<ApiResponse<Void>> reactivateContractType(
    @PathVariable UUID id,
    @Valid @RequestBody ExperienceContractTypeDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok();
    }

    service.reactivateContractType(id);
    return ApiResponses.okMessage("Experience contract type reactivated");
  }
}
