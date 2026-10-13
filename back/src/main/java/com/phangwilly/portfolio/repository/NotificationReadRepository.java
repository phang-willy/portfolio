package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.NotificationRead;
import com.phangwilly.portfolio.model.NotificationReadId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, NotificationReadId> {
}
