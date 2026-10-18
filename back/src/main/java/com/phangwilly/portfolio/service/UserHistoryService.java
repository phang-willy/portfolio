package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.enums.UserHistoryType;
import com.phangwilly.portfolio.model.User;
import com.phangwilly.portfolio.model.UserHistory;
import com.phangwilly.portfolio.repository.UserHistoryRepository;
import com.phangwilly.portfolio.repository.UserRepository;
import com.phangwilly.portfolio.security.AuthenticatedUser;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UserHistoryService {

  private final UserHistoryRepository userHistoryRepository;
  private final UserRepository userRepository;

  public UserHistoryService(
    UserHistoryRepository userHistoryRepository,
    UserRepository userRepository
  ) {
    this.userHistoryRepository = userHistoryRepository;
    this.userRepository = userRepository;
  }

  public void record(User subject, UserHistoryType type, AuthenticatedUser actor, String detail) {
    save(subject, type, actor.id(), actorName(actor), detail);
  }

  public void recordSelf(User subject, UserHistoryType type, String detail) {
    save(subject, type, subject.getId(), displayName(subject), detail);
  }

  private void save(
    User subject,
    UserHistoryType type,
    UUID actorId,
    String actorName,
    String detail
  ) {
    userHistoryRepository.save(new UserHistory(subject, type, actorId, actorName, detail));
  }

  private String actorName(AuthenticatedUser actor) {
    return userRepository
      .findById(actor.id())
      .map(UserHistoryService::displayName)
      .filter(name -> !name.isBlank())
      .orElse(actor.email());
  }

  static String displayName(User user) {
    return (user.getFirstname() + " " + user.getLastname()).trim();
  }
}
