package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Stack;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StackRepository extends JpaRepository<Stack, UUID> {

  Page<Stack> findByDeletedAtIsNull(Pageable pageable);

  Optional<Stack> findByIdAndDeletedAtIsNull(UUID id);
}
