package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.model.Project;
import com.phangwilly.portfolio.repository.ProjectRepository;
import com.phangwilly.portfolio.security.CurrentUserService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProjectGithubSyncServiceTest {

  private static final Instant CREATED = Instant.parse("2024-01-01T00:00:00Z");
  private static final Instant STORED_UPDATED = Instant.parse("2026-01-01T00:00:00Z");
  private static final Instant NEWER_UPDATED = Instant.parse("2026-06-01T00:00:00Z");
  private static final Instant OLDER_UPDATED = Instant.parse("2025-06-01T00:00:00Z");

  @Mock
  private ProjectRepository projectRepository;

  @Mock
  private GithubRepoDatesClient githubRepoDatesClient;

  @Mock
  private NotificationService notificationService;

  @Mock
  private CurrentUserService currentUserService;

  private ProjectGithubSyncService service;

  @BeforeEach
  void setUp() {
    service = new ProjectGithubSyncService(
      projectRepository,
      githubRepoDatesClient,
      notificationService,
      currentUserService
    );
  }

  @Test
  void refreshKeepsTheNewerDateAndNotifiesWhenGithubMovedForward() {
    Project project = project();
    project.applyGithubDates(CREATED, STORED_UPDATED);
    when(githubRepoDatesClient.fetch(new GithubRepoRef("example", "geolock")))
      .thenReturn(Optional.of(new GithubRepoDates(CREATED, NEWER_UPDATED)));

    boolean updated = service.refresh(List.of(project));

    assertThat(updated).isTrue();
    assertThat(project.getGithubUpdatedAt()).isEqualTo(NEWER_UPDATED);
    verify(notificationService).notify(
      eq(ProjectGithubSyncService.NOTIFICATION_CODE),
      eq("Project updated on GitHub"),
      eq("Geolock (geolock) was updated on GitHub: 2026-01-01 -> 2026-06-01.")
    );
  }

  @Test
  void refreshKeepsTheStoredDateWhenGithubIsOlder() {
    Project project = project();
    project.applyGithubDates(CREATED, STORED_UPDATED);
    when(githubRepoDatesClient.fetch(any()))
      .thenReturn(Optional.of(new GithubRepoDates(CREATED, OLDER_UPDATED)));

    boolean updated = service.refresh(List.of(project));

    assertThat(updated).isFalse();
    assertThat(project.getGithubUpdatedAt()).isEqualTo(STORED_UPDATED);
    verify(notificationService, never()).notify(any(), any(), any());
  }

  @Test
  void refreshStoresTheFirstSnapshotWithoutNotifying() {
    Project project = project();
    when(githubRepoDatesClient.fetch(any()))
      .thenReturn(Optional.of(new GithubRepoDates(CREATED, NEWER_UPDATED)));

    boolean updated = service.refresh(List.of(project));

    assertThat(updated).isFalse();
    assertThat(project.getGithubCreatedAt()).isEqualTo(CREATED);
    assertThat(project.getGithubUpdatedAt()).isEqualTo(NEWER_UPDATED);
    verify(notificationService, never()).notify(any(), any(), any());
  }

  @Test
  void refreshClearsDatesWhenTheGithubLinkIsRemoved() {
    Project project = projectWithoutLink();
    project.applyGithubDates(CREATED, STORED_UPDATED);

    boolean updated = service.refresh(List.of(project));

    assertThat(updated).isFalse();
    assertThat(project.getGithubCreatedAt()).isNull();
    assertThat(project.getGithubUpdatedAt()).isNull();
    verify(githubRepoDatesClient, never()).fetch(any());
    verify(notificationService, never()).notify(any(), any(), any());
  }

  private static Project project() {
    Project project = new Project(
      "Geolock",
      "geolock",
      "",
      "",
      null,
      "https://github.com/example/geolock",
      null,
      "",
      "fr"
    );
    ReflectionTestUtils.setField(project, "id", UUID.randomUUID());
    return project;
  }

  private static Project projectWithoutLink() {
    Project project = new Project(
      "Notes",
      "notes",
      "",
      "",
      "https://example.com",
      null,
      null,
      "",
      "fr"
    );
    ReflectionTestUtils.setField(project, "id", UUID.randomUUID());
    return project;
  }
}
