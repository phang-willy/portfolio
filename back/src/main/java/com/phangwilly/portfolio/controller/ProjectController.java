package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.ApiResponses;
import com.phangwilly.portfolio.dto.PaginatedApiResponse;
import com.phangwilly.portfolio.dto.ProjectResponse;
import com.phangwilly.portfolio.service.ProjectImageService;
import com.phangwilly.portfolio.service.ProjectService;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/project")
public class ProjectController {

  private final ProjectService projectService;
  private final ProjectImageService projectImageService;

  public ProjectController(ProjectService projectService, ProjectImageService projectImageService) {
    this.projectService = projectService;
    this.projectImageService = projectImageService;
  }

  @GetMapping
  public ResponseEntity<PaginatedApiResponse<ProjectResponse>> getProjects(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ApiResponses.okPaginated(projectService.getProjects(page, size));
  }

  @GetMapping("/image/{filename}")
  public ResponseEntity<Resource> getImage(@PathVariable String filename) {
    Resource resource = projectImageService.loadImage(filename);
    return ResponseEntity.ok()
      .contentType(projectImageService.resolveImageMediaType(filename))
      .body(resource);
  }
}
