package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Contact;
import com.phangwilly.portfolio.model.ContactHistory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContactHistoryRepository extends JpaRepository<ContactHistory, UUID> {

  @EntityGraph(attributePaths = "emailQueue")
  List<ContactHistory> findByContactIdAndDeletedAtIsNullOrderByCreatedAtAscIdAsc(UUID contactId);

  @Query("""
    SELECT h.contact FROM ContactHistory h
    WHERE h.emailQueue.id = :emailId AND h.deletedAt IS NULL AND h.contact.deletedAt IS NULL
    """)
  Optional<Contact> findContactByEmailQueueId(@Param("emailId") UUID emailId);
}
