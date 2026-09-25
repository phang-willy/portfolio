package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ProjectImageProperties;
import com.phangwilly.portfolio.dto.ProjectImageUploadResponse;
import com.phangwilly.portfolio.exception.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProjectImageService {

  private static final String PROJECT_NOT_FOUND_CODE = "PROJECT_NOT_FOUND";
  private static final String PROJECT_NOT_FOUND_MESSAGE = "Project not found";
  private static final String INVALID_IMAGE_CODE = "INVALID_IMAGE";
  private static final String PUBLIC_IMAGE_PATH_PREFIX = "/api/project/image/";

  private final ProjectImageProperties projectImageProperties;

  public ProjectImageService(ProjectImageProperties projectImageProperties) {
    this.projectImageProperties = projectImageProperties;
  }

  public ProjectImageUploadResponse storeImage(MultipartFile file) {
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

    return new ProjectImageUploadResponse(PUBLIC_IMAGE_PATH_PREFIX + filename);
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
    return new ApiException(HttpStatus.NOT_FOUND, PROJECT_NOT_FOUND_CODE, PROJECT_NOT_FOUND_MESSAGE);
  }

  private static ApiException badRequest(String code, String message) {
    return new ApiException(HttpStatus.BAD_REQUEST, code, message);
  }
}
