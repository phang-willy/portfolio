package com.phangwilly.portfolio.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.phangwilly.portfolio.config.AuthProperties;
import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.User;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTest {

  private static final Instant NOW = Instant.parse("2026-01-01T12:00:00Z");
  private static final UUID USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

  private JwtService jwtService;
  private User user;

  @BeforeEach
  void setUp() {
    AuthProperties properties = new AuthProperties();
    properties.setJwtSecret("test-jwt-secret-with-enough-length");
    jwtService = new JwtService(properties, new ObjectMapper());

    user = mock(User.class);
    when(user.getId()).thenReturn(USER_ID);
    when(user.getEmail()).thenReturn("willy@example.com");
    when(user.getRole()).thenReturn(UserRole.USER);
  }

  @Test
  void rejectsExpiredTokenWhenValidatingForAuthentication() {
    Instant expiredAt = NOW.minus(Duration.ofMinutes(1));
    String token = jwtService.generateToken(user, expiredAt);

    Optional<JwtPayload> payload = jwtService.parseAndValidate(token, NOW);

    assertThat(payload).isEmpty();
  }

  @Test
  void acceptsExpiredTokenWhenValidatingSignatureOnly() {
    Instant expiredAt = NOW.minus(Duration.ofMinutes(1));
    String token = jwtService.generateToken(user, expiredAt);

    Optional<JwtPayload> payload = jwtService.parseAndValidateSignature(token);

    assertThat(payload).isPresent();
    assertThat(payload.orElseThrow().userId()).isEqualTo(USER_ID);
    assertThat(payload.orElseThrow().expiresAt().getEpochSecond())
      .isEqualTo(expiredAt.getEpochSecond());
  }

  @Test
  void rejectsTamperedTokenWhenValidatingSignatureOnly() {
    Instant expiredAt = NOW.plus(Duration.ofHours(1));
    String token = jwtService.generateToken(user, expiredAt) + "tampered";

    Optional<JwtPayload> payload = jwtService.parseAndValidateSignature(token);

    assertThat(payload).isEmpty();
  }
}
