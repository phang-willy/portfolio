package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Notification;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  @Query("""
    select count(notification)
    from Notification notification
    where not exists (
      select receipt.id.notificationId
      from NotificationRead receipt
      where receipt.id.notificationId = notification.id
        and receipt.id.userId = :userId
    )
    """)
  long countUnread(@Param("userId") UUID userId);

  @Query("""
    select notification
    from Notification notification
    where not exists (
      select receipt.id.notificationId
      from NotificationRead receipt
      where receipt.id.notificationId = notification.id
        and receipt.id.userId = :userId
    )
    """)
  List<Notification> findUnread(@Param("userId") UUID userId);
}
