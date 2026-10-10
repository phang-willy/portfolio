package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.NotificationRead;
import com.phangwilly.portfolio.model.NotificationReadId;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, NotificationReadId> {

  @Query("""
    select receipt.id.notificationId
    from NotificationRead receipt
    where receipt.id.userId = :userId
      and receipt.id.notificationId in :ids
    """)
  List<UUID> findReadNotificationIds(@Param("userId") UUID userId, @Param("ids") Collection<UUID> ids);
}
