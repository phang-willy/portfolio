package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.model.Stack;
import java.time.Instant;
import java.util.UUID;

public record StackResponse(
  UUID id,
  String name,
  String image,
  Instant createdAt,
  Instant updatedAt
) {

  public static StackResponse from(Stack stack) {
    return new StackResponse(
      stack.getId(),
      stack.getName(),
      stack.getImage(),
      stack.getCreatedAt(),
      stack.getUpdatedAt()
    );
  }
}
