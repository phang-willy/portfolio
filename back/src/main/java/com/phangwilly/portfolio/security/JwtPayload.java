package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.enums.UserRole;
import java.time.Instant;
import java.util.UUID;

public record JwtPayload(
  UUID userId,
  String email,
  UserRole role,
  Instant expiresAt
) {
}
