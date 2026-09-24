package com.phangwilly.portfolio.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.model.ServiceHealthKind;
import com.phangwilly.portfolio.model.ServiceHealthTarget;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class ServiceHealthPropertiesTest {

  @Test
  void buildsTargetsFromConfiguredAddressesAndSkipsBlankOnes() {
    ServiceHealthProperties properties = new ServiceHealthProperties();
    properties.setSiteUrl("http://localhost:3000");
    properties.setFrontProbeUrl("http://front-dev:3000");
    properties.setAdminBaseUrl("http://localhost:3001");
    properties.setApiBaseUrl("http://localhost:8000");
    properties.setServerPort(8000);
    properties.setDatasourceUrl("jdbc:postgresql://postgres:5432/portfolio");
    properties.setSmtpHost("maildev");
    properties.setSmtpPort(1025);
    properties.setAdminerPublicUrl("http://127.0.0.1:8080");
    properties.setAdminerProbeUrl("http://adminer:8080");
    properties.setMailWebProbeUrl(" ");
    properties.setMailWebPublicUrl(null);

    Map<String, ServiceHealthTarget> targets = properties.targets().stream()
      .collect(Collectors.toMap(ServiceHealthTarget::code, Function.identity()));

    assertThat(targets).containsOnlyKeys("front", "admin", "api", "postgres", "smtp", "adminer");
    assertThat(targets.get("front").endpoint()).isEqualTo("http://localhost:3000");
    assertThat(targets.get("front").probe()).isEqualTo("http://front-dev:3000");
    assertThat(targets.get("admin").probe()).isEqualTo("http://localhost:3001");
    assertThat(targets.get("api").endpoint()).isEqualTo("http://localhost:8000");
    assertThat(targets.get("api").probe()).isEqualTo("http://127.0.0.1:8000/api/health");
    assertThat(targets.get("postgres").kind()).isEqualTo(ServiceHealthKind.JDBC);
    assertThat(targets.get("postgres").endpoint()).isEqualTo("postgres:5432");
    assertThat(targets.get("smtp").kind()).isEqualTo(ServiceHealthKind.TCP);
    assertThat(targets.get("smtp").endpoint()).isEqualTo("maildev:1025");
    assertThat(targets.get("adminer").endpoint()).isEqualTo("http://127.0.0.1:8080");
    assertThat(targets.get("adminer").probe()).isEqualTo("http://adminer:8080");
  }

  @Test
  void skipsAdminerWhenNoProbeUrlIsConfigured() {
    ServiceHealthProperties properties = new ServiceHealthProperties();
    properties.setApiBaseUrl("http://localhost:8000");
    properties.setServerPort(8000);
    properties.setDatasourceUrl("jdbc:postgresql://postgres:5432/portfolio");

    assertThat(properties.targets())
      .extracting(ServiceHealthTarget::code)
      .doesNotContain("adminer", "mail");
  }

  @Test
  void readsThePostgresHostFromTheJdbcUrl() {
    assertThat(ServiceHealthProperties.postgresEndpoint("jdbc:postgresql://localhost:5432/portfolio?ssl=false"))
      .isEqualTo("localhost:5432");
  }

  @Test
  void mapsRestartableComposeServicesAndSkipsInvalidNames() {
    ServiceHealthProperties properties = new ServiceHealthProperties();
    properties.setRestartServices("front=front-dev, smtp=maildev, bad=../back, missing");

    assertThat(properties.composeService("front")).isEqualTo("front-dev");
    assertThat(properties.composeService("smtp")).isEqualTo("maildev");
    assertThat(properties.restartable("front")).isTrue();
    assertThat(properties.composeService("bad")).isNull();
    assertThat(properties.restartable("api")).isFalse();
    assertThat(properties.composeProject()).isEqualTo("portfolio");
  }
}
