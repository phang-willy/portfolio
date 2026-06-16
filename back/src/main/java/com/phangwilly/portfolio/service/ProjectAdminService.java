package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ProjectImageProperties;
import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.PaginationRequest;
import com.phangwilly.portfolio.dto.ProjectAdminDetail;
import com.phangwilly.portfolio.dto.ProjectAdminListItem;
import com.phangwilly.portfolio.dto.ProjectAdminRequest;
import com.phangwilly.portfolio.dto.ProjectImageUploadResponse;
import com.phangwilly.portfolio.dto.ProjectLocaleRequest;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.model.Project;
import com.phangwilly.portfolio.model.ProjectStack;
import com.phangwilly.portfolio.model.Stack;
import com.phangwilly.portfolio.repository.ProjectRepository;
import com.phangwilly.portfolio.repository.ProjectStackRepository;
import com.phangwilly.portfolio.repository.StackRepository;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProjectAdminService {

  private static final String PROJECT_NOT_FOUND_CODE = "PROJECT_NOT_FOUND";
  private static final String PROJECT_NOT_FOUND_MESSAGE = "Project not found";
  private static final String PROJECT_SLUG_EXISTS_CODE = "PROJECT_SLUG_EXISTS";
  private static final String PROJECT_SLUG_EXISTS_MESSAGE = "A project with this slug already exists";
  private static final String STACK_NOT_FOUND_CODE = "STACK_NOT_FOUND";
  private static final String STACK_NOT_FOUND_MESSAGE = "One or more stacks were not found";
  private static final String PROJECT_NOT_DEACTIVATED_CODE = "PROJECT_NOT_DEACTIVATED";
  private static final String PROJECT_NOT_DEACTIVATED_MESSAGE =
    "Project must be deactivated before it can be permanently deleted";
  private static final String INVALID_IMAGE_CODE = "INVALID_IMAGE";
  private static final String LANG_FR = "fr";
  private static final String LANG_EN = "en";
  private static final Sort SLUG_SORT = Sort.by(Sort.Direction.ASC, "slug");

  private final ProjectRepository projectRepository;
  private final ProjectStackRepository projectStackRepository;
  private final StackRepository stackRepository;
  private final CurrentUserService currentUserService;
  private final ProjectImageProperties projectImageProperties;

  public ProjectAdminService(
    ProjectRepository projectRepository,
    ProjectStackRepository projectStackRepository,
    StackRepository stackRepository,
    CurrentUserService currentUserService,
    ProjectImageProperties projectImageProperties
  ) {
    this.projectRepository = projectRepository;
    this.projectStackRepository = projectStackRepository;
    this.stackRepository = stackRepository;
    this.currentUserService = currentUserService;
    this.projectImageProperties = projectImageProperties;
  }

  @Transactional(readOnly = true)
  public PageResponse<ProjectAdminListItem> getProjects(Integer page, Integer size) {
    PaginationRequest paginationRequest = PaginationRequest.of(page, size);
    Page<String> slugPage = projectRepository.findDistinctActiveSlugs(
      paginationRequest.toPageable(SLUG_SORT)
    );

    List<ProjectAdminListItem> items = slugPage
      .getContent()
      .stream()
      .map(this::toListItem)
      .toList();

    return new PageResponse<>(
      items,
      new PageResponse.Pagination(
        slugPage.getNumber(),
        slugPage.getSize(),
        slugPage.getTotalElements(),
        slugPage.getTotalPages()
      )
    );
  }

  @Transactional(readOnly = true)
  public ProjectAdminDetail getProject(UUID id) {
    return toDetail(getProjectGroup(id));
  }

  @Transactional
  public ProjectAdminDetail createProject(ProjectAdminRequest request) {
    currentUserService.requireAdmin();
    String slug = normalizeSlug(request.slug());

    if (
      projectRepository.existsBySlugAndLangAndDeletedAtIsNull(slug, LANG_FR) ||
      projectRepository.existsBySlugAndLangAndDeletedAtIsNull(slug, LANG_EN)
    ) {
      throw conflict(PROJECT_SLUG_EXISTS_CODE, PROJECT_SLUG_EXISTS_MESSAGE);
    }

    List<Stack> stacks = resolveStacks(request.stackIds());
    Project frProject = createLocaleProject(slug, request, LANG_FR, request.fr());
    Project enProject = createLocaleProject(slug, request, LANG_EN, request.en());
    syncStacks(frProject, stacks);
    syncStacks(enProject, stacks);

    return toDetail(List.of(frProject, enProject));
  }

  @Transactional
  public ProjectAdminDetail updateProject(UUID id, ProjectAdminRequest request) {
    List<Project> existing = getProjectGroup(id);
    String currentSlug = findByLang(existing, LANG_FR).getSlug();
    String nextSlug = normalizeSlug(request.slug());

    if (!currentSlug.equals(nextSlug)) {
      if (
        projectRepository.existsBySlugAndLangAndDeletedAtIsNull(nextSlug, LANG_FR) ||
        projectRepository.existsBySlugAndLangAndDeletedAtIsNull(nextSlug, LANG_EN)
      ) {
        throw conflict(PROJECT_SLUG_EXISTS_CODE, PROJECT_SLUG_EXISTS_MESSAGE);
      }
    }

    List<Stack> stacks = resolveStacks(request.stackIds());
    Project frProject = findByLang(existing, LANG_FR);
    Project enProject = findByLang(existing, LANG_EN);

    updateLocaleProject(frProject, nextSlug, request, LANG_FR, request.fr());
    updateLocaleProject(enProject, nextSlug, request, LANG_EN, request.en());
    syncStacks(frProject, stacks);
    syncStacks(enProject, stacks);

    projectRepository.saveAndFlush(frProject);
    projectRepository.saveAndFlush(enProject);

    return toDetail(List.of(frProject, enProject));
  }

  @Transactional
  public void deleteProject(UUID id) {
    currentUserService.requireAdmin();
    List<Project> projects = getProjectGroup(id);

    for (Project project : projects) {
      if (project.getDeactivatedAt() == null) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          PROJECT_NOT_DEACTIVATED_CODE,
          PROJECT_NOT_DEACTIVATED_MESSAGE
        );
      }
    }

    List<UUID> projectIds = projects.stream().map(Project::getId).toList();
    projectStackRepository.deleteAllByProjectIdIn(projectIds);
    projectRepository.deleteAll(projects);
  }

  @Transactional
  public void deactivateProject(UUID id) {
    currentUserService.requireAdmin();
    List<Project> projects = getProjectGroup(id);

    for (Project project : projects) {
      if (project.getDeactivatedAt() == null) {
        project.markDeactivated();
      }
      projectRepository.save(project);
    }
  }

  @Transactional
  public void reactivateProject(UUID id) {
    currentUserService.requireAdmin();
    List<Project> projects = getProjectGroup(id);

    for (Project project : projects) {
      if (project.getDeactivatedAt() != null) {
        project.reactivate();
      }
      projectRepository.save(project);
    }
  }

  @Transactional
  public ProjectImageUploadResponse uploadImage(MultipartFile file) {
    currentUserService.requireAdmin();

    if (file == null || file.isEmpty()) {
      throw badRequest(INVALID_IMAGE_CODE, "Image file is required");
    }

    if (file.getSize() > projectImageProperties.getMaxBytes()) {
      throw badRequest(INVALID_IMAGE_CODE, "Image file is too large");
    }

    String contentType = file.getContentType();
    if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
      throw badRequest(INVALID_IMAGE_CODE, "Only image files are allowed");
    }

    String extension = resolveExtension(file.getOriginalFilename(), contentType);
    String filename = UUID.randomUUID() + extension;
    Path uploadDir = Path.of(projectImageProperties.getUploadDir()).toAbsolutePath().normalize();

    try {
      Files.createDirectories(uploadDir);
      Path destination = uploadDir.resolve(filename).normalize();
      if (!destination.startsWith(uploadDir)) {
        throw badRequest(INVALID_IMAGE_CODE, "Invalid image filename");
      }

      try (InputStream inputStream = file.getInputStream()) {
        Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
      }
    } catch (IOException exception) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "IMAGE_UPLOAD_FAILED",
        "Unable to store image"
      );
    }

    return new ProjectImageUploadResponse("/api/admin/project/image/" + filename);
  }

  @Transactional(readOnly = true)
  public Resource loadImage(String filename) {
    String safeName = Path.of(filename).getFileName().toString();
    if (!safeName.equals(filename)) {
      throw notFound();
    }

    Path uploadDir = Path.of(projectImageProperties.getUploadDir()).toAbsolutePath().normalize();
    Path imagePath = uploadDir.resolve(safeName).normalize();
    if (!imagePath.startsWith(uploadDir) || !Files.isRegularFile(imagePath)) {
      throw notFound();
    }

    return new FileSystemResource(imagePath);
  }

  @Transactional(readOnly = true)
  public MediaType resolveImageMediaType(String filename) {
    String extension = StringUtils.getFilenameExtension(filename);
    if (extension == null) {
      return MediaType.APPLICATION_OCTET_STREAM;
    }

    return switch (extension.toLowerCase(Locale.ROOT)) {
      case "png" -> MediaType.IMAGE_PNG;
      case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
      case "gif" -> MediaType.IMAGE_GIF;
      case "webp" -> MediaType.parseMediaType("image/webp");
      case "svg" -> MediaType.parseMediaType("image/svg+xml");
      default -> MediaType.APPLICATION_OCTET_STREAM;
    };
  }

  private ProjectAdminListItem toListItem(String slug) {
    List<Project> projects = projectRepository.findBySlugAndDeletedAtIsNull(slug);
    Project fr = findByLangOrNull(projects, LANG_FR);
    Project en = findByLangOrNull(projects, LANG_EN);
    UUID id = fr != null ? fr.getId() : en != null ? en.getId() : null;
    List<String> stackNames = projectStackRepository
      .findActiveStacksByProjectSlug(slug)
      .stream()
      .map(Stack::getName)
      .sorted(Comparator.naturalOrder())
      .toList();

    Instant createdAt = projects
      .stream()
      .map(Project::getCreatedAt)
      .filter(Objects::nonNull)
      .min(Comparator.naturalOrder())
      .orElse(null);
    Instant updatedAt = projects
      .stream()
      .map(Project::getUpdatedAt)
      .filter(Objects::nonNull)
      .max(Comparator.naturalOrder())
      .orElse(null);

    return new ProjectAdminListItem(
      id,
      slug,
      fr != null ? fr.getTitle() : "",
      en != null ? en.getTitle() : "",
      stackNames,
      createdAt,
      updatedAt,
      fr != null ? fr.getDeactivatedAt() : en != null ? en.getDeactivatedAt() : null
    );
  }

  private ProjectAdminDetail toDetail(List<Project> projects) {
    Project fr = findByLang(projects, LANG_FR);
    Project en = findByLang(projects, LANG_EN);
    List<UUID> stackIds = projectStackRepository
      .findActiveByProjectId(fr.getId())
      .stream()
      .map(link -> link.getStack().getId())
      .toList();

    return new ProjectAdminDetail(
      fr.getId(),
      fr.getSlug(),
      stackIds,
      fr.getProductionLink(),
      fr.getSourceCodeLink(),
      fr.getImageLink(),
      toLocaleRequest(fr),
      toLocaleRequest(en)
    );
  }

  private static ProjectLocaleRequest toLocaleRequest(Project project) {
    return new ProjectLocaleRequest(
      project.getTitle(),
      project.getDescription(),
      project.getContent(),
      project.getImageAlt()
    );
  }

  private Project createLocaleProject(
    String slug,
    ProjectAdminRequest request,
    String lang,
    ProjectLocaleRequest locale
  ) {
    Project project = new Project(
      locale.title().trim(),
      slug,
      normalizeOptional(locale.description()),
      normalizeOptional(locale.content()),
      normalizeOptional(request.productionLink()),
      normalizeOptional(request.sourceCodeLink()),
      normalizeOptional(request.imageLink()),
      normalizeOptional(locale.imageAlt()),
      lang
    );
    return projectRepository.saveAndFlush(project);
  }

  private void updateLocaleProject(
    Project project,
    String slug,
    ProjectAdminRequest request,
    String lang,
    ProjectLocaleRequest locale
  ) {
    project.updateDetails(
      locale.title().trim(),
      slug,
      normalizeOptional(locale.description()),
      normalizeOptional(locale.content()),
      normalizeOptional(request.productionLink()),
      normalizeOptional(request.sourceCodeLink()),
      normalizeOptional(request.imageLink()),
      normalizeOptional(locale.imageAlt()),
      lang
    );
  }

  private void syncStacks(Project project, List<Stack> stacks) {
    List<ProjectStack> existingLinks = new ArrayList<>(
      projectStackRepository.findActiveByProjectId(project.getId())
    );
    Set<UUID> desiredIds = stacks.stream().map(Stack::getId).collect(Collectors.toSet());

    for (ProjectStack link : existingLinks) {
      if (!desiredIds.contains(link.getStack().getId())) {
        link.markDeleted();
        projectStackRepository.save(link);
      }
    }

    Set<UUID> currentIds = existingLinks
      .stream()
      .filter(link -> link.getDeletedAt() == null)
      .map(link -> link.getStack().getId())
      .collect(Collectors.toSet());

    for (Stack stack : stacks) {
      if (!currentIds.contains(stack.getId())) {
        projectStackRepository.saveAndFlush(new ProjectStack(project, stack));
      }
    }
  }

  private List<Stack> resolveStacks(List<UUID> stackIds) {
    if (stackIds == null || stackIds.isEmpty()) {
      return List.of();
    }

    Set<UUID> uniqueIds = new HashSet<>(stackIds);
    List<Stack> stacks = stackRepository.findAllById(uniqueIds)
      .stream()
      .filter(stack -> stack.getDeletedAt() == null)
      .toList();

    if (stacks.size() != uniqueIds.size()) {
      throw notFound(STACK_NOT_FOUND_CODE, STACK_NOT_FOUND_MESSAGE);
    }

    return stacks;
  }

  private List<Project> getProjectGroup(UUID id) {
    Project project = projectRepository
      .findByIdAndDeletedAtIsNull(id)
      .orElseThrow(ProjectAdminService::notFound);

    return getProjectGroup(project.getSlug());
  }

  private List<Project> getProjectGroup(String slug) {
    List<Project> projects = projectRepository.findBySlugAndDeletedAtIsNull(slug);
    if (projects.isEmpty() || !hasLang(projects, LANG_FR) || !hasLang(projects, LANG_EN)) {
      throw notFound();
    }

    return projects;
  }

  private static boolean hasLang(List<Project> projects, String lang) {
    return projects.stream().anyMatch(project -> lang.equals(project.getLang()));
  }

  private static Project findByLang(List<Project> projects, String lang) {
    return projects
      .stream()
      .filter(project -> lang.equals(project.getLang()))
      .findFirst()
      .orElseThrow(() -> notFound());
  }

  private static Project findByLangOrNull(List<Project> projects, String lang) {
    return projects
      .stream()
      .filter(project -> lang.equals(project.getLang()))
      .findFirst()
      .orElse(null);
  }

  private static String normalizeSlug(String slug) {
    return slug.trim().toLowerCase(Locale.ROOT);
  }

  private static String normalizeOptional(String value) {
    if (value == null) {
      return null;
    }

    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private static String resolveExtension(String originalFilename, String contentType) {
    String extension = StringUtils.getFilenameExtension(originalFilename);
    if (extension != null && !extension.isBlank()) {
      return "." + extension.toLowerCase(Locale.ROOT);
    }

    return switch (contentType.toLowerCase(Locale.ROOT)) {
      case "image/png" -> ".png";
      case "image/jpeg" -> ".jpg";
      case "image/gif" -> ".gif";
      case "image/webp" -> ".webp";
      case "image/svg+xml" -> ".svg";
      default -> "";
    };
  }

  private static ApiException notFound() {
    return notFound(PROJECT_NOT_FOUND_CODE, PROJECT_NOT_FOUND_MESSAGE);
  }

  private static ApiException notFound(String code, String message) {
    return new ApiException(HttpStatus.NOT_FOUND, code, message);
  }

  private static ApiException conflict(String code, String message) {
    return new ApiException(HttpStatus.CONFLICT, code, message);
  }

  private static ApiException badRequest(String code, String message) {
    return new ApiException(HttpStatus.BAD_REQUEST, code, message);
  }
}
