package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Project;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

  Page<Project> findByDeletedAtIsNullAndDeactivatedAtIsNull(Pageable pageable);

  Page<Project> findByDeletedAtIsNull(Pageable pageable);

  Optional<Project> findByIdAndDeletedAtIsNull(UUID id);

  Optional<Project> findBySlugAndLangAndDeletedAtIsNull(String slug, String lang);

  List<Project> findBySlugAndDeletedAtIsNull(String slug);

  boolean existsBySlugAndLangAndDeletedAtIsNull(String slug, String lang);

  @Query(
    value = """
    SELECT DISTINCT p.slug FROM Project p
    WHERE p.deletedAt IS NULL
    ORDER BY p.slug ASC
    """,
    countQuery = """
    SELECT COUNT(DISTINCT p.slug) FROM Project p
    WHERE p.deletedAt IS NULL
    """
  )
  Page<String> findDistinctActiveSlugs(Pageable pageable);
}
