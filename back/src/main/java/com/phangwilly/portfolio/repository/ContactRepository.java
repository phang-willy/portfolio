package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.enums.ContactStatus;
import com.phangwilly.portfolio.model.Contact;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContactRepository extends JpaRepository<Contact, UUID>, JpaSpecificationExecutor<Contact> {

  Optional<Contact> findByIdAndDeletedAtIsNull(UUID id);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT c FROM Contact c WHERE c.id = :id AND c.deletedAt IS NULL")
  Optional<Contact> findActiveForUpdate(@Param("id") UUID id);

  long countByStatusAndDeletedAtIsNull(ContactStatus status);
}
