package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.UserRole;
import com.phangwilly.portfolio.model.User;
import java.util.UUID;

public record UserResponse(
  UUID id,
  String firstname,
  String lastname,
  String email,
  UserRole role
) {

  public static UserResponse from(User user) {
    return new UserResponse(
      user.getId(),
      user.getFirstname(),
      user.getLastname(),
      user.getEmail(),
      user.getRole()
    );
  }
}
