package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.ProjectStack;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectStackRepository extends JpaRepository<ProjectStack, UUID> {
}
