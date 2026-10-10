package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.StandardProtocolFamily;
import java.net.UnixDomainSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class DockerEngineClientTest {

  @Test
  void restartsTheMatchingComposeContainer() throws Exception {
    Path directory = Files.createTempDirectory("docker-engine");
    Path socket = directory.resolve("docker.sock");
    try (ServerSocketChannel server = ServerSocketChannel.open(StandardProtocolFamily.UNIX)) {
      server.bind(UnixDomainSocketAddress.of(socket));
      Thread responder = Thread.startVirtualThread(() -> answer(server));

      new DockerEngineClient(socket).restartComposeService("portfolio", "front-dev");

      responder.join(5000);
      assertThat(responder.isAlive()).isFalse();
    }
  }

  @Test
  void failsWhenDockerHasNoMatchingContainer() throws Exception {
    Path directory = Files.createTempDirectory("docker-engine-empty");
    Path socket = directory.resolve("docker.sock");
    try (ServerSocketChannel server = ServerSocketChannel.open(StandardProtocolFamily.UNIX)) {
      server.bind(UnixDomainSocketAddress.of(socket));
      Thread.startVirtualThread(() -> answerEmpty(server));

      assertThatThrownBy(() -> new DockerEngineClient(socket).restartComposeService("portfolio", "front-dev"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessage("No container for front-dev");
    }
  }

  private static void answer(ServerSocketChannel server) {
    try {
      for (int call = 0; call < 2; call++) {
        try (SocketChannel channel = server.accept()) {
          String request = readHeaders(channel);
          String response = request.startsWith("GET")
            ? ok("[{\"Id\":\"abc123def4567890\",\"State\":\"running\"}]")
            : "HTTP/1.1 204 No Content\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
          channel.write(ByteBuffer.wrap(response.getBytes(StandardCharsets.US_ASCII)));
        }
      }
    } catch (IOException exception) {
      throw new UncheckedIOException(exception);
    }
  }

  private static void answerEmpty(ServerSocketChannel server) {
    try (SocketChannel channel = server.accept()) {
      readHeaders(channel);
      String response = ok("[]");
      channel.write(ByteBuffer.wrap(response.getBytes(StandardCharsets.US_ASCII)));
    } catch (IOException exception) {
      throw new UncheckedIOException(exception);
    }
  }

  private static String ok(String body) {
    return "HTTP/1.1 200 OK\r\nContent-Length: " + body.length() + "\r\nConnection: close\r\n\r\n" + body;
  }

  private static String readHeaders(SocketChannel channel) throws IOException {
    StringBuilder request = new StringBuilder();
    ByteBuffer buffer = ByteBuffer.allocate(1024);
    while (!request.toString().contains("\r\n\r\n")) {
      buffer.clear();
      if (channel.read(buffer) < 0) {
        break;
      }
      buffer.flip();
      byte[] bytes = new byte[buffer.remaining()];
      buffer.get(bytes);
      request.append(new String(bytes, StandardCharsets.US_ASCII));
    }
    return request.toString();
  }
}
