package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Notification;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    order by notification.createdAt desc, notification.id desc
    """)
  List<Notification> findUnread(@Param("userId") UUID userId);

  @Query(
    value = """
      select notification
      from Notification notification
      where exists (
        select receipt.id.notificationId
        from NotificationRead receipt
        where receipt.id.notificationId = notification.id
          and receipt.id.userId = :userId
      )
      """,
    countQuery = """
      select count(notification)
      from Notification notification
      where exists (
        select receipt.id.notificationId
        from NotificationRead receipt
        where receipt.id.notificationId = notification.id
          and receipt.id.userId = :userId
      )
      """
  )
  Page<Notification> findRead(@Param("userId") UUID userId, Pageable pageable);
}
