package com.phangwilly.portfolio.controller;

import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.ProjectResponse;
import com.phangwilly.portfolio.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/project")
public class ProjectController {

  private final ProjectService projectService;

  public ProjectController(ProjectService projectService) {
    this.projectService = projectService;
  }

  @GetMapping
  public ResponseEntity<PageResponse<ProjectResponse>> getProjects(
    @RequestParam(required = false) Integer page,
    @RequestParam(required = false) Integer size
  ) {
    return ResponseEntity.ok(projectService.getProjects(page, size));
  }
}
