package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.User;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserAdminDetail(
  UUID id,
  String email,
  UserRole role,
  String lastname,
  String firstname,
  Instant createdAt,
  Instant updatedAt,
  Instant deactivatedAt,
  Instant verifiedAt,
  boolean manageable,
  List<UserRole> assignableRoles,
  List<UserHistoryEntry> history
) {

  public static UserAdminDetail from(
    User user,
    boolean manageable,
    List<UserRole> assignableRoles,
    List<UserHistoryEntry> history
  ) {
    return new UserAdminDetail(
      user.getId(),
      user.getEmail(),
      user.getRole(),
      user.getLastname(),
      user.getFirstname(),
      user.getCreatedAt(),
      user.getUpdatedAt(),
      user.getDeactivatedAt(),
      user.getVerifiedAt(),
      manageable,
      assignableRoles,
      history
    );
  }
}
