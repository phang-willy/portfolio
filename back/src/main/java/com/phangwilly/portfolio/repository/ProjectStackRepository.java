package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Project;
import com.phangwilly.portfolio.model.ProjectStack;
import com.phangwilly.portfolio.model.Stack;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProjectStackRepository extends JpaRepository<ProjectStack, UUID> {

  @Query(
    """
    SELECT ps FROM ProjectStack ps
    JOIN FETCH ps.stack
    WHERE ps.project.id = :projectId AND ps.deletedAt IS NULL
    """
  )
  List<ProjectStack> findActiveByProjectId(@Param("projectId") UUID projectId);

  @Query(
    """
    SELECT DISTINCT ps.stack FROM ProjectStack ps
    WHERE ps.project.slug = :slug AND ps.deletedAt IS NULL AND ps.project.deletedAt IS NULL
    """
  )
  List<Stack> findActiveStacksByProjectSlug(@Param("slug") String slug);

  @Query(
    """
    SELECT ps FROM ProjectStack ps
    WHERE ps.project.slug = :slug AND ps.deletedAt IS NULL AND ps.project.deletedAt IS NULL
    """
  )
  List<ProjectStack> findActiveByProjectSlug(@Param("slug") String slug);

  @Modifying(clearAutomatically = true)
  @Query("DELETE FROM ProjectStack ps WHERE ps.project.id IN :projectIds")
  void deleteAllByProjectIdIn(@Param("projectIds") List<UUID> projectIds);
}
