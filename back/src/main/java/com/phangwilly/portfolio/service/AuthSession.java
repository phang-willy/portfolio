package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.dto.AuthenticatedUserResponse;
import java.time.Instant;

public record AuthSession(
  String token,
  Instant expiredAt,
  AuthenticatedUserResponse authenticatedUser
) {
}
