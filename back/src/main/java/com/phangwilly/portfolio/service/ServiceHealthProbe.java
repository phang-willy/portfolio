package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import com.phangwilly.portfolio.model.ServiceHealthCheck;
import com.phangwilly.portfolio.model.ServiceHealthTarget;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.time.Duration;
import java.time.Instant;
import javax.sql.DataSource;
import org.springframework.stereotype.Component;

@Component
public class ServiceHealthProbe {

  private final DataSource dataSource;
  private final ServiceHealthProperties properties;
  private final HttpClient httpClient;

  public ServiceHealthProbe(DataSource dataSource, ServiceHealthProperties properties) {
    this.dataSource = dataSource;
    this.properties = properties;
    this.httpClient = HttpClient.newBuilder()
      .version(HttpClient.Version.HTTP_1_1)
      .connectTimeout(Duration.ofMillis(properties.getTimeoutMillis()))
      .followRedirects(HttpClient.Redirect.NEVER)
      .build();
  }

  public ServiceHealthCheck probe(ServiceHealthTarget target, Instant checkedAt) {
    boolean up = switch (target.kind()) {
      case HTTP -> httpUp(target.probe());
      case TCP -> tcpUp(target.host(), target.port());
      case JDBC -> jdbcUp();
    };
    return new ServiceHealthCheck(
      target.code(),
      target.service(),
      target.endpoint(),
      up ? ServiceHealthCheck.UP : ServiceHealthCheck.DOWN,
      checkedAt
    );
  }

  private boolean httpUp(String url) {
    try {
      HttpRequest request = HttpRequest.newBuilder(URI.create(url))
        .timeout(Duration.ofMillis(properties.getTimeoutMillis()))
        .GET()
        .build();
      int status = httpClient.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
      return status >= 200 && status < 500;
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      return false;
    } catch (Exception exception) {
      return false;
    }
  }

  private boolean tcpUp(String host, int port) {
    if (host == null || host.isBlank() || port <= 0) {
      return false;
    }
    try (Socket socket = new Socket()) {
      socket.connect(new InetSocketAddress(host, port), properties.getTimeoutMillis());
      return true;
    } catch (Exception exception) {
      return false;
    }
  }

  private boolean jdbcUp() {
    try (Connection connection = dataSource.getConnection()) {
      return connection.isValid(Math.max(1, properties.getTimeoutMillis() / 1000));
    } catch (Exception exception) {
      return false;
    }
  }
}
