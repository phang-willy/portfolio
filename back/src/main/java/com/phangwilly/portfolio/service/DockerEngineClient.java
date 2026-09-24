package com.phangwilly.portfolio.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.UnixDomainSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

final class DockerEngineClient {

  private static final Pattern NAME = Pattern.compile("[A-Za-z0-9][A-Za-z0-9_.-]{0,63}");
  private static final Pattern CONTAINER_ID = Pattern.compile("[a-fA-F0-9]{12,64}");
  private static final ObjectMapper JSON = new ObjectMapper();

  private final Path socket;

  DockerEngineClient(Path socket) {
    this.socket = socket;
  }

  void restartComposeService(String project, String service) {
    if (!NAME.matcher(project).matches() || !NAME.matcher(service).matches()) {
      throw new IllegalArgumentException("Invalid compose service");
    }
    if (!Files.isReadable(socket)) {
      throw new IllegalStateException("Docker socket is not readable");
    }
    String id = containerId(project, service);
    HttpResponse restarted = exchange(
      "POST",
      "/v1.41/containers/" + id + "/restart?t=10"
    );
    if (restarted.status() < 200 || restarted.status() >= 300) {
      throw new IllegalStateException("Docker restart failed with status " + restarted.status());
    }
  }

  private String containerId(String project, String service) {
    try {
      String filters = JSON.writeValueAsString(Map.of(
        "label",
        List.of(
          "com.docker.compose.project=" + project,
          "com.docker.compose.service=" + service
        )
      ));
      String path = "/v1.41/containers/json?all=1&filters="
        + java.net.URLEncoder.encode(filters, StandardCharsets.UTF_8);
      HttpResponse listed = exchange("GET", path);
      if (listed.status() < 200 || listed.status() >= 300) {
        throw new IllegalStateException("Docker list failed with status " + listed.status());
      }
      JsonNode containers = JSON.readTree(listed.body().isEmpty() ? "[]" : listed.body());
      if (!containers.isArray() || containers.isEmpty()) {
        throw new IllegalStateException("No container for " + service);
      }
      String id = containers.get(0).path("Id").asText("");
      if (!CONTAINER_ID.matcher(id).matches()) {
        throw new IllegalStateException("Docker returned an invalid container id");
      }
      return id;
    } catch (IOException exception) {
      throw new IllegalStateException("Could not read Docker containers", exception);
    }
  }

  private HttpResponse exchange(String method, String path) {
    UnixDomainSocketAddress address = UnixDomainSocketAddress.of(socket);
    try (SocketChannel channel = SocketChannel.open(address)) {
      byte[] request = (
        method + " " + path + " HTTP/1.1\r\n"
          + "Host: docker\r\n"
          + "Content-Length: 0\r\n"
          + "Connection: close\r\n\r\n"
      ).getBytes(StandardCharsets.US_ASCII);
      writeAll(channel, request);
      byte[] raw = readAll(channel);
      return parse(raw);
    } catch (IOException exception) {
      throw new IllegalStateException("Docker socket request failed", exception);
    }
  }

  private static void writeAll(SocketChannel channel, byte[] request) throws IOException {
    ByteBuffer buffer = ByteBuffer.wrap(request);
    while (buffer.hasRemaining()) {
      channel.write(buffer);
    }
  }

  private static byte[] readAll(SocketChannel channel) throws IOException {
    ByteArrayOutputStream body = new ByteArrayOutputStream();
    ByteBuffer buffer = ByteBuffer.allocate(8192);
    int read;
    while ((read = channel.read(buffer)) != -1) {
      buffer.flip();
      byte[] chunk = new byte[read];
      buffer.get(chunk);
      body.write(chunk);
      buffer.clear();
    }
    return body.toByteArray();
  }

  private static HttpResponse parse(byte[] raw) {
    int headerEnd = indexOf(raw, "\r\n\r\n".getBytes(StandardCharsets.US_ASCII));
    if (headerEnd < 0) {
      throw new IllegalStateException("Docker returned an incomplete response");
    }
    String header = new String(raw, 0, headerEnd, StandardCharsets.ISO_8859_1);
    int status = statusCode(header);
    byte[] payload = new byte[raw.length - headerEnd - 4];
    System.arraycopy(raw, headerEnd + 4, payload, 0, payload.length);
    if (header.toLowerCase().contains("transfer-encoding: chunked")) {
      payload = decodeChunks(payload);
    }
    return new HttpResponse(status, new String(payload, StandardCharsets.UTF_8).trim());
  }

  private static int statusCode(String header) {
    int firstSpace = header.indexOf(' ');
    int secondSpace = header.indexOf(' ', firstSpace + 1);
    if (firstSpace < 0 || secondSpace < 0) {
      throw new IllegalStateException("Docker returned an invalid status line");
    }
    return Integer.parseInt(header.substring(firstSpace + 1, secondSpace));
  }

  private static byte[] decodeChunks(byte[] payload) {
    ByteArrayOutputStream decoded = new ByteArrayOutputStream();
    int offset = 0;
    while (offset < payload.length) {
      int lineEnd = indexOf(payload, "\r\n".getBytes(StandardCharsets.US_ASCII), offset);
      if (lineEnd < 0) {
        break;
      }
      int size = Integer.parseInt(new String(payload, offset, lineEnd - offset, StandardCharsets.US_ASCII).trim(), 16);
      if (size == 0) {
        break;
      }
      int dataStart = lineEnd + 2;
      decoded.write(payload, dataStart, size);
      offset = dataStart + size + 2;
    }
    return decoded.toByteArray();
  }

  private static int indexOf(byte[] raw, byte[] needle) {
    return indexOf(raw, needle, 0);
  }

  private static int indexOf(byte[] raw, byte[] needle, int from) {
    for (int i = from; i <= raw.length - needle.length; i++) {
      boolean matches = true;
      for (int j = 0; j < needle.length; j++) {
        if (raw[i + j] != needle[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return i;
      }
    }
    return -1;
  }

  private record HttpResponse(int status, String body) {
  }
}
