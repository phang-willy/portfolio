package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.phangwilly.portfolio.config.SitemapProperties;
import com.phangwilly.portfolio.exception.ApiException;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class SitemapAdminServiceTest {

  private HttpServer server;

  @AfterEach
  void stopServer() {
    if (server != null) {
      server.stop(0);
    }
  }

  @Test
  void generateRefusesWhenTheTokenIsMissing() {
    SitemapAdminService service = service("http://front:3000", "");

    assertThatThrownBy(service::generate)
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
  }

  @Test
  void generateReturnsTheUrlCountFromThePortfolio() throws Exception {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/api/sitemap", exchange -> {
      byte[] body = "{\"urlCount\":8}".getBytes(StandardCharsets.UTF_8);
      exchange.sendResponseHeaders(200, body.length);
      exchange.getResponseBody().write(body);
      exchange.close();
    });
    server.start();

    SitemapAdminService service = service("http://127.0.0.1:" + server.getAddress().getPort(), "secret");

    assertThat(service.generate().urlCount()).isEqualTo(8);
  }

  @Test
  void generateFailsWhenThePortfolioRejectsTheCall() throws Exception {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.createContext("/api/sitemap", exchange -> {
      exchange.sendResponseHeaders(401, -1);
      exchange.close();
    });
    server.start();

    SitemapAdminService service = service("http://127.0.0.1:" + server.getAddress().getPort(), "secret");

    assertThatThrownBy(service::generate)
      .isInstanceOf(ApiException.class)
      .extracting(error -> ((ApiException) error).status())
      .isEqualTo(HttpStatus.BAD_GATEWAY);
  }

  private static SitemapAdminService service(String frontUrl, String token) {
    SitemapProperties properties = new SitemapProperties();
    properties.setFrontUrl(frontUrl);
    properties.setToken(token);
    properties.setTimeoutMillis(2000);
    return new SitemapAdminService(properties);
  }
}
