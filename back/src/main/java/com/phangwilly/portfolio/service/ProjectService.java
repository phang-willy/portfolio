package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.dto.ProjectResponse;
import com.phangwilly.portfolio.repository.ProjectRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

  private static final Sort DEFAULT_SORT = Sort
    .by(Sort.Direction.DESC, "createdAt")
    .and(Sort.by(Sort.Direction.DESC, "id"));

  private final ProjectRepository projectRepository;

  public ProjectService(ProjectRepository projectRepository) {
    this.projectRepository = projectRepository;
  }

  @Transactional(readOnly = true)
  public PageResponse<ProjectResponse> getProjects(Integer page, Integer size) {
    PaginationRequest paginationRequest = PaginationRequest.of(page, size);

    return PageResponse.from(
      projectRepository
        .findByDeletedAtIsNullAndDeactivatedAtIsNull(paginationRequest.toPageable(DEFAULT_SORT))
        .map(ProjectResponse::from)
    );
  }
}
