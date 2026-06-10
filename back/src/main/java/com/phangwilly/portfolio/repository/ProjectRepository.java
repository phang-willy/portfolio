package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Project;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

  Page<Project> findByDeletedAtIsNullAndDeactivatedAtIsNull(Pageable pageable);
}
