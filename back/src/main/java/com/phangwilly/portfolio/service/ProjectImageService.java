package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ProjectImageProperties;
import com.phangwilly.portfolio.dto.ProjectImageUploadResponse;
import com.phangwilly.portfolio.exception.ApiException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
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
  private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp"
  );
  private static final byte[] PNG_SIGNATURE = new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47};
  private static final byte[] JPEG_SIGNATURE = new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
  private static final byte[] GIF87_SIGNATURE = "GIF87a".getBytes(StandardCharsets.US_ASCII);
  private static final byte[] GIF89_SIGNATURE = "GIF89a".getBytes(StandardCharsets.US_ASCII);
  private static final byte[] RIFF_SIGNATURE = "RIFF".getBytes(StandardCharsets.US_ASCII);
  private static final byte[] WEBP_MARKER = "WEBP".getBytes(StandardCharsets.US_ASCII);

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
    byte[] content = readContent(file);
    if (!hasImageSignature(content, extension.substring(1))) {
      throw badRequest(INVALID_IMAGE_CODE, "Image content does not match its type");
    }

    String filename = UUID.randomUUID() + extension;
    Path uploadDir = Path.of(projectImageProperties.getUploadDir()).toAbsolutePath().normalize();

    try {
      Files.createDirectories(uploadDir);
      Path destination = uploadDir.resolve(filename).normalize();
      if (!destination.startsWith(uploadDir)) {
        throw badRequest(INVALID_IMAGE_CODE, "Invalid image filename");
      }

      Files.write(destination, content);
    } catch (IOException exception) {
      throw uploadFailed();
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
    if (extension != null && ALLOWED_EXTENSIONS.contains(extension.toLowerCase(Locale.ROOT))) {
      return "." + extension.toLowerCase(Locale.ROOT);
    }

    String normalizedType = contentType.toLowerCase(Locale.ROOT);
    int separator = normalizedType.indexOf(';');
    if (separator >= 0) {
      normalizedType = normalizedType.substring(0, separator).trim();
    }

    return switch (normalizedType) {
      case "image/png" -> ".png";
      case "image/jpeg" -> ".jpg";
      case "image/gif" -> ".gif";
      case "image/webp" -> ".webp";
      default -> throw badRequest(INVALID_IMAGE_CODE, "Only image files are allowed");
    };
  }

  private static byte[] readContent(MultipartFile file) {
    try {
      return file.getBytes();
    } catch (IOException exception) {
      throw uploadFailed();
    }
  }

  private static boolean hasImageSignature(byte[] content, String extension) {
    return switch (extension) {
      case "png" -> startsWith(content, PNG_SIGNATURE);
      case "jpg", "jpeg" -> startsWith(content, JPEG_SIGNATURE);
      case "gif" -> startsWith(content, GIF87_SIGNATURE) || startsWith(content, GIF89_SIGNATURE);
      case "webp" -> startsWith(content, RIFF_SIGNATURE) && regionMatches(content, 8, WEBP_MARKER);
      default -> false;
    };
  }

  private static boolean startsWith(byte[] content, byte[] signature) {
    return regionMatches(content, 0, signature);
  }

  private static boolean regionMatches(byte[] content, int offset, byte[] signature) {
    if (content.length < offset + signature.length) {
      return false;
    }

    for (int index = 0; index < signature.length; index++) {
      if (content[offset + index] != signature[index]) {
        return false;
      }
    }

    return true;
  }

  private static ApiException uploadFailed() {
    return new ApiException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "IMAGE_UPLOAD_FAILED",
      "Unable to store image"
    );
  }

  private static ApiException notFound() {
    return new ApiException(HttpStatus.NOT_FOUND, PROJECT_NOT_FOUND_CODE, PROJECT_NOT_FOUND_MESSAGE);
  }

  private static ApiException badRequest(String code, String message) {
    return new ApiException(HttpStatus.BAD_REQUEST, code, message);
  }
}
