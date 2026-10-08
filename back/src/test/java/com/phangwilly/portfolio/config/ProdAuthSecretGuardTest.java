package com.phangwilly.portfolio.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class ProdAuthSecretGuardTest {

  private static final String DEPLOYED_JWT = "prod-jwt-secret-value-with-32-characters-min";
  private static final String DEPLOYED_HASH = "prod-token-hash-secret-value-32-characters";

  @Test
  void prodProfileRejectsPlaceholderSecrets() {
    assertThatThrownBy(() -> new ProdAuthSecretGuard(environment("prod"), placeholders()))
      .isInstanceOf(IllegalStateException.class)
      .hasMessageContaining("APP_AUTH_JWT_SECRET");
  }

  @Test
  void prodProfileRejectsASecretShorterThan32Characters() {
    AuthProperties properties = deployedSecrets();
    properties.setJwtSecret("too-short");

    assertThatThrownBy(() -> new ProdAuthSecretGuard(environment("prod"), properties))
      .isInstanceOf(IllegalStateException.class)
      .hasMessageContaining("APP_AUTH_JWT_SECRET")
      .hasMessageNotContaining("too-short");
  }

  @Test
  void prodProfileAcceptsDistinctDeployedSecrets() {
    assertThatCode(() -> new ProdAuthSecretGuard(environment("prod"), deployedSecrets()))
      .doesNotThrowAnyException();
  }

  @Test
  void devProfileKeepsThePlaceholderSecrets() {
    assertThatCode(() -> new ProdAuthSecretGuard(environment("dev"), placeholders()))
      .doesNotThrowAnyException();
  }

  private static MockEnvironment environment(String profile) {
    MockEnvironment environment = new MockEnvironment();
    environment.setActiveProfiles(profile);
    return environment;
  }

  private static AuthProperties placeholders() {
    return new AuthProperties();
  }

  private static AuthProperties deployedSecrets() {
    AuthProperties properties = new AuthProperties();
    properties.setJwtSecret(DEPLOYED_JWT);
    properties.setTokenHashSecret(DEPLOYED_HASH);
    return properties;
  }
}
