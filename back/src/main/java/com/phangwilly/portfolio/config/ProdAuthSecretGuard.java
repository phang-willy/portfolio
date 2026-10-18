package com.phangwilly.portfolio.config;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * The prod profile is the deployed profile, including pre-production.
 * Dev keeps the documented placeholders. Prod must refuse them before serving traffic.
 */
@Component
public class ProdAuthSecretGuard {

  static final String JWT_PLACEHOLDER =
    "change-this-dev-jwt-secret-with-at-least-32-characters";
  static final String TOKEN_HASH_PLACEHOLDER =
    "change-this-dev-token-hash-secret-with-at-least-32-characters";
  static final int MIN_SECRET_LENGTH = 32;

  public ProdAuthSecretGuard(Environment environment, AuthProperties authProperties) {
    if (!environment.matchesProfiles("prod")) {
      return;
    }

    requireDeployedSecret(authProperties.getJwtSecret(), "APP_AUTH_JWT_SECRET");
    requireDeployedSecret(authProperties.getTokenHashSecret(), "APP_AUTH_TOKEN_HASH_SECRET");
  }

  static void requireDeployedSecret(String secret, String name) {
    if (isUnusable(secret)) {
      throw new IllegalStateException(
        name + " must be a unique secret of at least " + MIN_SECRET_LENGTH
          + " characters when the prod profile is active"
      );
    }
  }

  private static boolean isUnusable(String secret) {
    return secret == null
      || secret.length() < MIN_SECRET_LENGTH
      || JWT_PLACEHOLDER.equals(secret)
      || TOKEN_HASH_PLACEHOLDER.equals(secret);
  }
}
