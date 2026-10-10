package com.phangwilly.portfolio.security;

import com.phangwilly.portfolio.enums.UserRole;
import java.util.UUID;

public record AuthenticatedUser(
  UUID id,
  String email,
  UserRole role,
  String tokenHash
) {
}
