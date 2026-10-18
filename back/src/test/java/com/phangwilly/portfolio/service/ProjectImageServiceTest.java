package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.phangwilly.portfolio.config.ProjectImageProperties;
import com.phangwilly.portfolio.dto.ProjectImageUploadResponse;
import com.phangwilly.portfolio.exception.ApiException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

class ProjectImageServiceTest {

  private static final String PUBLIC_IMAGE_PATH_PREFIX = "/api/project/image/";
  private static final byte[] PNG = new byte[] {
    (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01
  };
  private static final byte[] JPEG = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01};
  private static final byte[] GIF = new byte[] {'G', 'I', 'F', '8', '9', 'a', 0x01};
  private static final byte[] WEBP = new byte[] {
    'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P', 0x01
  };

  @TempDir
  Path uploadDir;

  private ProjectImageService service;

  @BeforeEach
  void setUp() {
    service = new ProjectImageService(properties(uploadDir, 1024));
  }

  @Test
  void storeImageWritesFileAndReturnsPublicUrl() throws Exception {
    MockMultipartFile file = image("Screenshot.PNG", "image/png", PNG);

    ProjectImageUploadResponse response = service.storeImage(file);

    assertThat(response.url()).matches(PUBLIC_IMAGE_PATH_PREFIX + "[0-9a-fA-F-]{36}\\.png");
    String filename = response.url().substring(PUBLIC_IMAGE_PATH_PREFIX.length());
    assertThat(Files.readAllBytes(uploadDir.resolve(filename))).containsExactly(PNG);
  }

  @Test
  void storeImageUsesContentTypeWhenFilenameHasNoExtension() {
    MockMultipartFile file = image("photo", "image/webp", WEBP);

    ProjectImageUploadResponse response = service.storeImage(file);

    assertThat(response.url()).endsWith(".webp");
  }

  @Test
  void storeImageReplacesDisallowedExtensionFromContentType() {
    MockMultipartFile file = image("photo.php", "image/png", PNG);

    ProjectImageUploadResponse response = service.storeImage(file);

    assertThat(response.url()).endsWith(".png");
    assertThat(response.url()).doesNotContain(".php");
  }

  @Test
  void storeImageRejectsUnknownImageTypeWithoutAllowedExtension() {
    MockMultipartFile file = image("photo", "image/bmp", new byte[] {1});

    assertThatThrownBy(() -> service.storeImage(file))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> assertInvalidImageError((ApiException) error, "Only image files are allowed"));
  }

  @Test
  void storeImageRejectsMissingFile() {
    assertRejectedImage(null, "Image file is required");
    assertRejectedImage(image("photo.png", "image/png", new byte[0]), "Image file is required");
  }

  @Test
  void storeImageRejectsOversizedFile() {
    MockMultipartFile file = image("photo.png", "image/png", new byte[] {1, 2, 3, 4, 5});
    ProjectImageService limitedService = new ProjectImageService(properties(uploadDir, 4));

    assertThatThrownBy(() -> limitedService.storeImage(file))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> assertInvalidImageError((ApiException) error, "Image file is too large"));
  }

  @Test
  void storeImageAcceptsJpegGifAndWebpSignatures() {
    assertThat(service.storeImage(image("photo.jpg", "image/jpeg", JPEG)).url()).endsWith(".jpg");
    assertThat(service.storeImage(image("photo.gif", "image/gif", GIF)).url()).endsWith(".gif");
    assertThat(service.storeImage(image("photo.webp", "image/webp", WEBP)).url()).endsWith(".webp");
  }

  @Test
  void storeImageRejectsSvgAndContentThatDoesNotMatchTheDeclaredType() {
    assertRejectedImage(
      image("icon.svg", "image/svg+xml", "<svg></svg>".getBytes()),
      "Only image files are allowed"
    );
    assertRejectedImage(
      image("photo.png", "image/png", "<svg onload=\"alert(1)\"></svg>".getBytes()),
      "Image content does not match its type"
    );
    assertRejectedImage(
      image("..\\..\\windows\\photo.png", "image/png", "not-an-image".getBytes()),
      "Image content does not match its type"
    );
    assertRejectedImage(
      image("photo.png", "image/png", JPEG),
      "Image content does not match its type"
    );
  }

  @Test
  void storeImageRejectsNonImageContentType() {
    MockMultipartFile file = new MockMultipartFile("file", "notes.txt", "text/plain", new byte[] {1});

    assertThatThrownBy(() -> service.storeImage(file))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> assertInvalidImageError((ApiException) error, "Only image files are allowed"));
  }

  @Test
  void storeImageReportsStorageFailure() throws Exception {
    Path blockingFile = uploadDir.resolve("not-a-directory");
    Files.writeString(blockingFile, "x");
    ProjectImageService brokenService = new ProjectImageService(properties(blockingFile, 1024));

    assertThatThrownBy(() -> brokenService.storeImage(image("photo.png", "image/png", PNG)))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> {
        ApiException apiException = (ApiException) error;
        assertThat(apiException.status()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(apiException.code()).isEqualTo("IMAGE_UPLOAD_FAILED");
        assertThat(apiException.getMessage()).isEqualTo("Unable to store image");
      });
  }

  @Test
  void loadImageReturnsExistingFile() throws Exception {
    Files.write(uploadDir.resolve("photo.png"), new byte[] {9, 8, 7});

    assertThat(service.loadImage("photo.png").getContentAsByteArray()).containsExactly(9, 8, 7);
  }

  @Test
  void loadImageRejectsMissingOrUnsafeFilename() {
    assertThatThrownBy(() -> service.loadImage("missing.png"))
      .isInstanceOf(ApiException.class)
      .satisfies(this::assertProjectNotFound);

    assertThatThrownBy(() -> service.loadImage("nested/photo.png"))
      .isInstanceOf(ApiException.class)
      .satisfies(this::assertProjectNotFound);
  }

  @Test
  void resolveImageMediaTypeUsesFileExtension() {
    assertThat(service.resolveImageMediaType("photo.png")).isEqualTo(MediaType.IMAGE_PNG);
    assertThat(service.resolveImageMediaType("photo.JPG")).isEqualTo(MediaType.IMAGE_JPEG);
    assertThat(service.resolveImageMediaType("photo.jpeg")).isEqualTo(MediaType.IMAGE_JPEG);
    assertThat(service.resolveImageMediaType("photo.gif")).isEqualTo(MediaType.IMAGE_GIF);
    assertThat(service.resolveImageMediaType("photo.webp")).isEqualTo(MediaType.parseMediaType("image/webp"));
    assertThat(service.resolveImageMediaType("photo.svg")).isEqualTo(MediaType.parseMediaType("image/svg+xml"));
    assertThat(service.resolveImageMediaType("photo.bin")).isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
    assertThat(service.resolveImageMediaType("photo")).isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
  }

  private void assertRejectedImage(MultipartFile file, String message) {
    assertThatThrownBy(() -> service.storeImage(file))
      .isInstanceOf(ApiException.class)
      .satisfies(error -> assertInvalidImageError((ApiException) error, message));
  }

  private static void assertInvalidImageError(ApiException error, String message) {
    assertThat(error.status()).isEqualTo(HttpStatus.BAD_REQUEST);
    assertThat(error.code()).isEqualTo("INVALID_IMAGE");
    assertThat(error.getMessage()).isEqualTo(message);
  }

  private void assertProjectNotFound(Throwable error) {
    ApiException apiException = (ApiException) error;
    assertThat(apiException.status()).isEqualTo(HttpStatus.NOT_FOUND);
    assertThat(apiException.code()).isEqualTo("PROJECT_NOT_FOUND");
    assertThat(apiException.getMessage()).isEqualTo("Project not found");
  }

  private static ProjectImageProperties properties(Path directory, long maxBytes) {
    ProjectImageProperties properties = new ProjectImageProperties();
    properties.setUploadDir(directory.toString());
    properties.setMaxBytes(maxBytes);
    return properties;
  }

  private static MockMultipartFile image(String filename, String contentType, byte[] content) {
    return new MockMultipartFile("file", filename, contentType, content);
  }
}
