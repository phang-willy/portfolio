package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.model.EmailQueue;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailQueueRepository extends JpaRepository<EmailQueue, UUID> {

  List<EmailQueue> findByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
    EmailQueueStatus status,
    Instant scheduledAt,
    Pageable pageable
  );
}
