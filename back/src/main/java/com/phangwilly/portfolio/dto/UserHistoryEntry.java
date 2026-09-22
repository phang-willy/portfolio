package com.phangwilly.portfolio.dto;

import com.phangwilly.portfolio.enums.UserHistoryType;
import com.phangwilly.portfolio.model.UserHistory;
import java.time.Instant;
import java.util.UUID;

public record UserHistoryEntry(
  UUID id,
  UserHistoryType type,
  UUID actorId,
  String actorName,
  String detail,
  Instant createdAt
) {

  public static UserHistoryEntry from(UserHistory history) {
    return new UserHistoryEntry(
      history.getId(),
      history.getType(),
      history.getActorId(),
      history.getActorName(),
      history.getDetail(),
      history.getCreatedAt()
    );
  }
}
