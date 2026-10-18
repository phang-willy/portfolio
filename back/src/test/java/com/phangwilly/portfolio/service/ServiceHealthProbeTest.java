package com.phangwilly.portfolio.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.phangwilly.portfolio.config.ServiceHealthProperties;
import com.phangwilly.portfolio.model.ServiceHealthCheck;
import com.phangwilly.portfolio.model.ServiceHealthKind;
import com.phangwilly.portfolio.model.ServiceHealthTarget;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.sql.SQLException;
import java.time.Instant;
import java.util.concurrent.Executors;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;

class ServiceHealthProbeTest {

  @Test
  void httpProbeIsUpBelow500AndDownWhenThePortIsClosed() throws IOException, SQLException {
    ServiceHealthProperties properties = new ServiceHealthProperties();
    properties.setTimeoutMillis(500);
    DataSource dataSource = mock(DataSource.class);
    when(dataSource.getConnection()).thenThrow(new SQLException("down"));
    ServiceHealthProbe probe = new ServiceHealthProbe(dataSource, properties);
    Instant checkedAt = Instant.parse("2026-09-24T12:00:00Z");

    HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    var executor = Executors.newVirtualThreadPerTaskExecutor();
    server.setExecutor(executor);
    server.createContext("/ok", exchange -> {
      exchange.sendResponseHeaders(204, -1);
      exchange.close();
    });
    server.createContext("/fail", exchange -> {
      exchange.sendResponseHeaders(503, -1);
      exchange.close();
    });
    server.start();
    try {
      int port = server.getAddress().getPort();
      ServiceHealthCheck up = probe.probe(httpTarget("http://127.0.0.1:" + port + "/ok"), checkedAt);
      ServiceHealthCheck down = probe.probe(httpTarget("http://127.0.0.1:" + port + "/fail"), checkedAt);
      ServiceHealthCheck closed = probe.probe(httpTarget("http://127.0.0.1:1"), checkedAt);
      ServiceHealthCheck database = probe.probe(
        new ServiceHealthTarget("postgres", "PostgreSQL", "localhost:5432", ServiceHealthKind.JDBC, null, null, 0),
        checkedAt
      );

      assertThat(up.status()).isEqualTo(ServiceHealthCheck.UP);
      assertThat(down.status()).isEqualTo(ServiceHealthCheck.DOWN);
      assertThat(closed.status()).isEqualTo(ServiceHealthCheck.DOWN);
      assertThat(database.status()).isEqualTo(ServiceHealthCheck.DOWN);
    } finally {
      server.stop(0);
      executor.close();
    }
  }

  private static ServiceHealthTarget httpTarget(String url) {
    return new ServiceHealthTarget("front", "Front", url, ServiceHealthKind.HTTP, url, null, 0);
  }
}
