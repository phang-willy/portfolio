package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.enums.EmailQueueStatus;
import com.phangwilly.portfolio.model.EmailQueue;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmailQueueRepository extends JpaRepository<EmailQueue, UUID> {

  @Query("""
    select email.id from EmailQueue email
    where email.status = :status and email.scheduledAt <= :scheduledAt
    order by email.scheduledAt asc, email.id asc
    """)
  List<UUID> findDueIds(
    @Param("status") EmailQueueStatus status,
    @Param("scheduledAt") Instant scheduledAt,
    Pageable pageable
  );

  @Query(value = """
    select * from email_queue
    where id = :id and status = 'PENDING' and scheduled_at <= :now
    for update skip locked
    """, nativeQuery = true)
  Optional<EmailQueue> findDueByIdForUpdate(@Param("id") UUID id, @Param("now") Instant now);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select email from EmailQueue email where email.id = :id")
  Optional<EmailQueue> findByIdForUpdate(@Param("id") UUID id);

  long countByStatus(EmailQueueStatus status);
}
