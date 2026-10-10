package com.phangwilly.portfolio.model;

import com.phangwilly.portfolio.enums.UserHistoryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "user_history")
public class UserHistory extends AuditableEntity {

  private static final int TYPE_MAX_LENGTH = 40;
  private static final int ACTOR_NAME_MAX_LENGTH = 511;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = TYPE_MAX_LENGTH)
  private UserHistoryType type;

  @Column(name = "actor_id")
  private UUID actorId;

  @Column(name = "actor_name", length = ACTOR_NAME_MAX_LENGTH)
  private String actorName;

  @Column(columnDefinition = "text")
  private String detail;

  protected UserHistory() {
  }

  public UserHistory(
    User user,
    UserHistoryType type,
    UUID actorId,
    String actorName,
    String detail
  ) {
    this.user = user;
    this.type = type;
    this.actorId = actorId;
    this.actorName = actorName;
    this.detail = detail;
  }

  public User getUser() {
    return user;
  }

  public UserHistoryType getType() {
    return type;
  }

  public UUID getActorId() {
    return actorId;
  }

  public String getActorName() {
    return actorName;
  }

  public String getDetail() {
    return detail;
  }
}
