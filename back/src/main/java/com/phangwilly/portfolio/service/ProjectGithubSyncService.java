package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.ProjectGithubSyncResponse;
import com.phangwilly.portfolio.model.Project;
import com.phangwilly.portfolio.repository.ProjectRepository;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProjectGithubSyncService {

  static final String NOTIFICATION_CODE = "github-project";

  private static final Logger LOGGER = LoggerFactory.getLogger(ProjectGithubSyncService.class);
  private static final String LANG_FR = "fr";

  private final ProjectRepository projectRepository;
  private final GithubRepoDatesClient githubRepoDatesClient;
  private final NotificationService notificationService;
  private final CurrentUserService currentUserService;

  public ProjectGithubSyncService(
    ProjectRepository projectRepository,
    GithubRepoDatesClient githubRepoDatesClient,
    NotificationService notificationService,
    CurrentUserService currentUserService
  ) {
    this.projectRepository = projectRepository;
    this.githubRepoDatesClient = githubRepoDatesClient;
    this.notificationService = notificationService;
    this.currentUserService = currentUserService;
  }

  @Scheduled(cron = "${app.github-project-dates.cron:0 30 3 * * *}", zone = "UTC")
  @Transactional
  public void syncDaily() {
    try {
      ProjectGithubSyncResponse result = syncAll();
      LOGGER.info(
        "GitHub project dates synced: {} checked, {} newer",
        result.checked(),
        result.updated()
      );
    } catch (RuntimeException exception) {
      LOGGER.warn("GitHub project date sync failed ({})", exception.getClass().getSimpleName());
    }
  }

  @Transactional
  public ProjectGithubSyncResponse syncForAdmin() {
    currentUserService.requireAdmin();
    return syncAll();
  }

  public ProjectGithubSyncResponse syncAll() {
    Map<String, List<Project>> groups = new LinkedHashMap<>();
    for (Project project : projectRepository.findAllByDeletedAtIsNull()) {
      groups.computeIfAbsent(project.getSlug(), key -> new ArrayList<>()).add(project);
    }

    int updated = 0;
    for (List<Project> group : groups.values()) {
      try {
        if (refresh(group)) {
          updated++;
        }
      } catch (RuntimeException exception) {
        LOGGER.warn(
          "GitHub dates skipped for {} ({})",
          group.getFirst().getSlug(),
          exception.getClass().getSimpleName()
        );
      }
    }
    return new ProjectGithubSyncResponse(groups.size(), updated);
  }

  /**
   * Fetches the GitHub dates for this locale pair.
   * The same repository keeps the newer timestamp. When the stored repository
   * identity differs from the current link, both dates are replaced.
   * Returns true when the update date moved forward on the same repository.
   */
  public boolean refresh(List<Project> projects) {
    if (projects == null || projects.isEmpty()) {
      return false;
    }

    try {
      return refreshUnchecked(projects);
    } catch (RuntimeException exception) {
      LOGGER.warn(
        "GitHub dates skipped for {} ({})",
        projects.getFirst().getSlug(),
        exception.getClass().getSimpleName()
      );
      return false;
    }
  }

  private boolean refreshUnchecked(List<Project> projects) {
    Optional<GithubRepoRef> repo = GithubRepoUrls.fromLinks(sourceLink(projects), productionLink(projects));
    if (repo.isEmpty()) {
      clearDates(projects);
      return false;
    }

    Optional<GithubRepoDates> fetched = githubRepoDatesClient.fetch(repo.get());
    if (fetched.isEmpty()) {
      return false;
    }

    Instant storedCreated = newest(projects, Project::getGithubCreatedAt);
    Instant storedUpdated = newest(projects, Project::getGithubUpdatedAt);
    GithubRepoDates incoming = fetched.get();
    String incomingKey = repo.get().key();
    boolean repositoryChanged = repositoryChanged(projects, incomingKey);
    Instant nextCreated = repositoryChanged
      ? incoming.createdAt()
      : GithubDateSelection.newer(storedCreated, incoming.createdAt());
    Instant nextUpdated = repositoryChanged
      ? incoming.updatedAt()
      : GithubDateSelection.newer(storedUpdated, incoming.updatedAt());
    boolean movedForward =
      !repositoryChanged && GithubDateSelection.movedForward(storedUpdated, incoming.updatedAt());

    for (Project project : projects) {
      if (project.applyGithubSnapshot(incomingKey, nextCreated, nextUpdated)) {
        projectRepository.save(project);
      }
    }

    if (movedForward) {
      notificationService.notify(
        NOTIFICATION_CODE,
        "Project updated on GitHub",
        message(projects, storedUpdated, nextUpdated)
      );
    }
    return movedForward;
  }

  private void clearDates(List<Project> projects) {
    for (Project project : projects) {
      if (project.clearGithubDates()) {
        projectRepository.save(project);
      }
    }
  }

  private static String message(List<Project> projects, Instant previous, Instant next) {
    Project sample = projects.getFirst();
    String title = projects
      .stream()
      .filter(project -> LANG_FR.equals(project.getLang()))
      .map(Project::getTitle)
      .filter(value -> value != null && !value.isBlank())
      .findFirst()
      .orElse(sample.getSlug());
    return title
      + " ("
      + sample.getSlug()
      + ") was updated on GitHub: "
      + formatDate(previous)
      + " -> "
      + formatDate(next)
      + ".";
  }

  private static String formatDate(Instant instant) {
    return instant == null ? "-" : instant.atZone(ZoneOffset.UTC).toLocalDate().toString();
  }

  private static boolean repositoryChanged(List<Project> projects, String incomingKey) {
    for (Project project : projects) {
      String stored = project.getGithubRepo();
      if (stored != null && !stored.isBlank() && !incomingKey.equals(stored)) {
        return true;
      }
    }
    return false;
  }

  private static Instant newest(List<Project> projects, Function<Project, Instant> reader) {
    return projects
      .stream()
      .map(reader)
      .filter(Objects::nonNull)
      .max(Comparator.naturalOrder())
      .orElse(null);
  }

  private static String sourceLink(List<Project> projects) {
    return firstLink(projects, Project::getSourceCodeLink);
  }

  private static String productionLink(List<Project> projects) {
    return firstLink(projects, Project::getProductionLink);
  }

  private static String firstLink(List<Project> projects, Function<Project, String> reader) {
    return projects
      .stream()
      .filter(project -> LANG_FR.equals(project.getLang()))
      .map(reader)
      .filter(value -> value != null && !value.isBlank())
      .findFirst()
      .orElseGet(() ->
        projects
          .stream()
          .map(reader)
          .filter(value -> value != null && !value.isBlank())
          .findFirst()
          .orElse(null)
      );
  }
}
