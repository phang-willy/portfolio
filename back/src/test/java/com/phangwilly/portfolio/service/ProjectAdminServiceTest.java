package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.dto.ProjectImageUploadResponse;
import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.repository.ProjectRepository;
import com.phangwilly.portfolio.repository.ProjectStackRepository;
import com.phangwilly.portfolio.repository.StackRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import com.phangwilly.portfolio.security.CurrentUserService;
import com.phangwilly.portfolio.enums.UserRole;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ProjectAdminServiceTest {

  @Mock
  private ProjectRepository projectRepository;

  @Mock
  private ProjectStackRepository projectStackRepository;

  @Mock
  private StackRepository stackRepository;

  @Mock
  private CurrentUserService currentUserService;

  @Mock
  private ProjectImageService projectImageService;

  private ProjectAdminService service;

  @BeforeEach
  void setUp() {
    service = new ProjectAdminService(
      projectRepository,
      projectStackRepository,
      stackRepository,
      currentUserService,
      projectImageService
    );
  }

  @Test
  void uploadImageRequiresAdminRole() {
    MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[] {1});
    when(currentUserService.requireAdmin())
      .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "Access denied"));

    assertThatThrownBy(() -> service.uploadImage(file))
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.FORBIDDEN);

    verifyNoInteractions(projectImageService);
  }

  @Test
  void uploadImageDelegatesStorageToProjectImageService() {
    MockMultipartFile file = new MockMultipartFile("file", "photo.png", "image/png", new byte[] {1});
    ProjectImageUploadResponse stored = new ProjectImageUploadResponse("/api/project/image/photo.png");
    when(currentUserService.requireAdmin())
      .thenReturn(new AuthenticatedUser(UUID.randomUUID(), "admin@example.com", UserRole.ADMIN, "hash"));
    when(projectImageService.storeImage(file)).thenReturn(stored);

    assertThat(service.uploadImage(file)).isEqualTo(stored);

    verify(currentUserService).requireAdmin();
    verify(projectImageService).storeImage(file);
  }
}
