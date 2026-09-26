package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.PageResponse;
import com.phangwilly.portfolio.dto.ProjectResponse;
import com.phangwilly.portfolio.model.Project;
import com.phangwilly.portfolio.model.ProjectStack;
import com.phangwilly.portfolio.model.Stack;
import com.phangwilly.portfolio.repository.ProjectRepository;
import com.phangwilly.portfolio.repository.ProjectStackRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

  @Mock
  private ProjectRepository projectRepository;

  @Mock
  private ProjectStackRepository projectStackRepository;

  private ProjectService service;

  @BeforeEach
  void setUp() {
    service = new ProjectService(projectRepository, projectStackRepository);
  }

  @Test
  void getProjectsGroupsLocalesAndStacks() {
    UUID frId = UUID.randomUUID();
    UUID enId = UUID.randomUUID();
    Instant createdAt = Instant.parse("2026-03-01T10:00:00Z");
    Instant updatedAt = Instant.parse("2026-04-01T10:00:00Z");
    Project fr = project(frId, "geolock", "fr", "Geolock", "Suivi", createdAt, updatedAt);
    Project en = project(enId, "geolock", "en", "Geolock", "Tracking", createdAt, updatedAt.plusSeconds(30));
    Stack react = stack(UUID.randomUUID(), "React");
    Stack next = stack(UUID.randomUUID(), "Next.js");

    when(projectRepository.findPublicProjects()).thenReturn(List.of(fr, en));
    when(projectStackRepository.findPublicProjectStacks()).thenReturn(List.of(
      new ProjectStack(fr, next),
      new ProjectStack(fr, react),
      new ProjectStack(en, react)
    ));

    PageResponse<ProjectResponse> page = service.getProjects(0, 50);

    assertThat(page.data()).hasSize(1);
    ProjectResponse response = page.data().getFirst();
    assertThat(response.slug()).isEqualTo("geolock");
    assertThat(response.id()).isEqualTo(frId);
    assertThat(response.fr().title()).isEqualTo("Geolock");
    assertThat(response.fr().description()).isEqualTo("Suivi");
    assertThat(response.en().description()).isEqualTo("Tracking");
    assertThat(response.stacks()).extracting(item -> item.name()).containsExactly("Next.js", "React");
    assertThat(response.createdAt()).isEqualTo(createdAt);
    assertThat(response.updatedAt()).isEqualTo(updatedAt.plusSeconds(30));
    assertThat(page.pagination().totalItems()).isEqualTo(1);
  }

  @Test
  void getProjectsKeepsProjectWithoutStacks() {
    Project fr = project(
      UUID.randomUUID(),
      "notes",
      "fr",
      "Notes",
      "Sans stack",
      Instant.parse("2025-01-01T00:00:00Z"),
      Instant.parse("2025-01-02T00:00:00Z")
    );
    Project en = project(
      UUID.randomUUID(),
      "notes",
      "en",
      "Notes",
      "No stack",
      Instant.parse("2025-01-01T00:00:00Z"),
      Instant.parse("2025-01-02T00:00:00Z")
    );

    when(projectRepository.findPublicProjects()).thenReturn(List.of(fr, en));
    when(projectStackRepository.findPublicProjectStacks()).thenReturn(List.of());

    PageResponse<ProjectResponse> page = service.getProjects(null, null);

    assertThat(page.data()).hasSize(1);
    assertThat(page.data().getFirst().stacks()).isEmpty();
    assertThat(page.pagination().totalPages()).isEqualTo(1);
  }

  @Test
  void getProjectsSortsByCreatedAtDescending() {
    Project older = project(
      UUID.randomUUID(),
      "older",
      "fr",
      "Older",
      "",
      Instant.parse("2024-01-01T00:00:00Z"),
      Instant.parse("2024-01-01T00:00:00Z")
    );
    Project newer = project(
      UUID.randomUUID(),
      "newer",
      "fr",
      "Newer",
      "",
      Instant.parse("2026-01-01T00:00:00Z"),
      Instant.parse("2026-01-01T00:00:00Z")
    );

    when(projectRepository.findPublicProjects()).thenReturn(List.of(older, newer));
    when(projectStackRepository.findPublicProjectStacks()).thenReturn(List.of());

    PageResponse<ProjectResponse> page = service.getProjects(0, 50);

    assertThat(page.data()).extracting(ProjectResponse::slug).containsExactly("newer", "older");
  }

  private static Project project(
    UUID id,
    String slug,
    String lang,
    String title,
    String description,
    Instant createdAt,
    Instant updatedAt
  ) {
    Project project = new Project(
      title,
      slug,
      description,
      "",
      "https://example.com",
      "https://github.com/example/" + slug,
      "/api/project/image/photo.webp",
      title,
      lang
    );
    ReflectionTestUtils.setField(project, "id", id);
    ReflectionTestUtils.setField(project, "createdAt", createdAt);
    ReflectionTestUtils.setField(project, "updatedAt", updatedAt);
    return project;
  }

  private static Stack stack(UUID id, String name) {
    Stack stack = new Stack(name, null);
    ReflectionTestUtils.setField(stack, "id", id);
    return stack;
  }
}
