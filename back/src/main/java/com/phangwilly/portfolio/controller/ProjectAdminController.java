package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponse;
import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.dto.ProjectAdminDetail;
import com.phangwilly.portfolio.dto.ProjectAdminListItem;
import com.phangwilly.portfolio.dto.ProjectAdminRequest;
import com.phangwilly.portfolio.dto.ProjectDeleteRequest;
import com.phangwilly.portfolio.dto.ProjectImageUploadResponse;
import com.phangwilly.portfolio.security.Honeypot;
import com.phangwilly.portfolio.service.ProjectAdminService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/project")
public class ProjectAdminController {

  private static final String PROJECT_DELETED_MESSAGE = "Project deleted";

  private final ProjectAdminService projectAdminService;

  public ProjectAdminController(ProjectAdminService projectAdminService) {
    this.projectAdminService = projectAdminService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<ProjectAdminListItem>> getProjects(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(projectAdminService.getProjects(page, size));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<ProjectAdminDetail>> getProject(@PathVariable UUID id) {
    return ApiResponses.ok(projectAdminService.getProject(id));
  }

  @PostMapping
  public ResponseEntity<ApiResponse<ProjectAdminDetail>> createProject(
    @Valid @RequestBody ProjectAdminRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(projectAdminService.createProject(request));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<ProjectAdminDetail>> updateProject(
    @PathVariable UUID id,
    @Valid @RequestBody ProjectAdminRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok(null);
    }

    return ApiResponses.ok(projectAdminService.updateProject(id, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteProject(
    @PathVariable UUID id,
    @Valid @RequestBody ProjectDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.okMessage(PROJECT_DELETED_MESSAGE);
    }

    projectAdminService.deleteProject(id);
    return ApiResponses.okMessage(PROJECT_DELETED_MESSAGE);
  }

  @PutMapping("/deactivate/{id}")
  public ResponseEntity<ApiResponse<Void>> deactivateProject(
    @PathVariable UUID id,
    @Valid @RequestBody ProjectDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok();
    }

    projectAdminService.deactivateProject(id);
    return ApiResponses.okMessage("Project deactivated");
  }

  @PutMapping("/reactivate/{id}")
  public ResponseEntity<ApiResponse<Void>> reactivateProject(
    @PathVariable UUID id,
    @Valid @RequestBody ProjectDeleteRequest request
  ) {
    if (Honeypot.isFilled(request.website())) {
      return ApiResponses.ok();
    }

    projectAdminService.reactivateProject(id);
    return ApiResponses.okMessage("Project reactivated");
  }

  @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<ApiResponse<ProjectImageUploadResponse>> uploadImage(
    @RequestParam("file") MultipartFile file
  ) {
    return ApiResponses.ok(projectAdminService.uploadImage(file));
  }
}
