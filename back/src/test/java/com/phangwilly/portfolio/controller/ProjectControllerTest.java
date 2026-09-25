package com.phangwilly.portfolio.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.exception.ApiException;
import com.phangwilly.portfolio.service.ProjectImageService;
import com.phangwilly.portfolio.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest {

  @Mock
  private ProjectService projectService;

  @Mock
  private ProjectImageService projectImageService;

  private ProjectController controller;

  @BeforeEach
  void setUp() {
    controller = new ProjectController(projectService, projectImageService);
  }

  @Test
  void getImageReturnsStoredResourceWithResolvedMediaType() {
    Resource resource = new ByteArrayResource(new byte[] {1, 2, 3});
    when(projectImageService.loadImage("photo.png")).thenReturn(resource);
    when(projectImageService.resolveImageMediaType("photo.png")).thenReturn(MediaType.IMAGE_PNG);

    var response = controller.getImage("photo.png");

    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.IMAGE_PNG);
    assertThat(response.getBody()).isSameAs(resource);
  }

  @Test
  void getImagePropagatesMissingImage() {
    when(projectImageService.loadImage("missing.png"))
      .thenThrow(new ApiException(HttpStatus.NOT_FOUND, "PROJECT_NOT_FOUND", "Project not found"));

    assertThatThrownBy(() -> controller.getImage("missing.png"))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiException = (ApiException) error;
        assertThat(apiException.status()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(apiException.code()).isEqualTo("PROJECT_NOT_FOUND");
      });
  }
}
