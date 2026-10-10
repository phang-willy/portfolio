package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.dto.ProjectPublicLocale;
import com.phangwilly.portfolio.dto.ProjectResponse;
import com.phangwilly.portfolio.dto.ProjectStackItem;
import com.phangwilly.portfolio.model.Project;
import com.phangwilly.portfolio.model.ProjectStack;
import com.phangwilly.portfolio.model.Stack;
import com.phangwilly.portfolio.repository.ProjectRepository;
import com.phangwilly.portfolio.repository.ProjectStackRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectService {

  private static final String LANG_FR = "fr";
  private static final String LANG_EN = "en";

  private final ProjectRepository projectRepository;
  private final ProjectStackRepository projectStackRepository;

  public ProjectService(
    ProjectRepository projectRepository,
    ProjectStackRepository projectStackRepository
  ) {
    this.projectRepository = projectRepository;
    this.projectStackRepository = projectStackRepository;
  }

  /**
   * Public projects grouped by slug (FR + EN) with their stacks.
   * Rows and stack links are loaded in two queries, then paginated in memory.
   */
  @Transactional(readOnly = true)
  public PageResponse<ProjectResponse> getProjects(Integer page, Integer size) {
    Map<String, List<Project>> projectsBySlug = new LinkedHashMap<>();
    for (Project project : projectRepository.findPublicProjects()) {
      projectsBySlug.computeIfAbsent(project.getSlug(), key -> new ArrayList<>()).add(project);
    }

    Map<UUID, List<ProjectStack>> stacksByProjectId = new LinkedHashMap<>();
    for (ProjectStack link : projectStackRepository.findPublicProjectStacks()) {
      stacksByProjectId
        .computeIfAbsent(link.getProject().getId(), key -> new ArrayList<>())
        .add(link);
    }

    List<ProjectResponse> projects = projectsBySlug
      .values()
      .stream()
      .map(locales -> toResponse(locales, stacksByProjectId))
      .sorted(
        Comparator
          .comparing(ProjectResponse::createdAt, Comparator.nullsLast(Comparator.reverseOrder()))
          .thenComparing(ProjectResponse::slug, Comparator.nullsLast(String::compareTo))
      )
      .toList();

    return paginate(projects, page, size);
  }

  private static ProjectResponse toResponse(
    List<Project> locales,
    Map<UUID, List<ProjectStack>> stacksByProjectId
  ) {
    Project fr = findByLang(locales, LANG_FR);
    Project en = findByLang(locales, LANG_EN);
    Project primary = fr != null ? fr : en;

    return new ProjectResponse(
      primary.getId(),
      primary.getSlug(),
      primary.getProductionLink(),
      primary.getSourceCodeLink(),
      primary.getImageLink(),
      earliest(locales, Project::getCreatedAt),
      latest(locales, Project::getUpdatedAt),
      stacksFor(locales, stacksByProjectId),
      ProjectPublicLocale.from(fr),
      ProjectPublicLocale.from(en)
    );
  }

  private static List<ProjectStackItem> stacksFor(
    List<Project> locales,
    Map<UUID, List<ProjectStack>> stacksByProjectId
  ) {
    Map<UUID, ProjectStackItem> unique = new LinkedHashMap<>();
    for (Project project : locales) {
      for (ProjectStack link : stacksByProjectId.getOrDefault(project.getId(), List.of())) {
        Stack stack = link.getStack();
        if (stack.getId() == null) {
          continue;
        }
        unique.putIfAbsent(stack.getId(), new ProjectStackItem(stack.getId(), stack.getName()));
      }
    }

    return unique
      .values()
      .stream()
      .sorted(Comparator.comparing(ProjectStackItem::name, String.CASE_INSENSITIVE_ORDER))
      .toList();
  }

  private static Project findByLang(List<Project> projects, String lang) {
    return projects
      .stream()
      .filter(project -> lang.equals(project.getLang()))
      .findFirst()
      .orElse(null);
  }

  private static Instant earliest(List<Project> projects, Function<Project, Instant> reader) {
    return projects
      .stream()
      .map(reader)
      .filter(Objects::nonNull)
      .min(Comparator.naturalOrder())
      .orElse(null);
  }

  private static Instant latest(List<Project> projects, Function<Project, Instant> reader) {
    return projects
      .stream()
      .map(reader)
      .filter(Objects::nonNull)
      .max(Comparator.naturalOrder())
      .orElse(null);
  }

  private static <T> PageResponse<T> paginate(List<T> items, Integer page, Integer size) {
    PaginationRequest request = PaginationRequest.of(page, size);
    int from = Math.min(request.page() * request.size(), items.size());
    int to = Math.min(from + request.size(), items.size());
    int totalPages = items.isEmpty() ? 0 : (int) Math.ceil((double) items.size() / request.size());

    return new PageResponse<>(
      List.copyOf(items.subList(from, to)),
      new PageResponse.Pagination(request.page(), request.size(), items.size(), totalPages)
    );
  }
}
