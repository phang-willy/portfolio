package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.User;
import java.time.Instant;
import java.util.UUID;

public record UserAdminListItem(
  UUID id,
  String email,
  UserRole role,
  String lastname,
  String firstname,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt
) {

  public static UserAdminListItem from(User user) {
    return new UserAdminListItem(
      user.getId(),
      user.getEmail(),
      user.getRole(),
      user.getLastname(),
      user.getFirstname(),
      user.getCreatedAt(),
      user.getUpdatedAt(),
      user.getDeactivatedAt()
    );
  }
}
