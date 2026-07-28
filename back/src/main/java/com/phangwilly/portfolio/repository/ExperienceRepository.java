package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.Experience;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExperienceRepository extends JpaRepository<Experience, UUID> {

  Optional<Experience> findByIdAndDeletedAtIsNull(UUID id);

  List<Experience> findByGroupIdAndDeletedAtIsNull(UUID groupId);

  boolean existsBySlugAndDeletedAtIsNull(String slug);

  Optional<Experience> findBySlugAndDeletedAtIsNull(String slug);

  boolean existsByContractTypeIdInAndDeletedAtIsNull(Collection<UUID> contractTypeIds);

  @Query(
    value = """
    SELECT DISTINCT e.groupId FROM Experience e
    WHERE e.deletedAt IS NULL
    ORDER BY e.groupId ASC
    """,
    countQuery = """
    SELECT COUNT(DISTINCT e.groupId) FROM Experience e
    WHERE e.deletedAt IS NULL
    """
  )
  Page<UUID> findDistinctActiveGroupIds(Pageable pageable);
}
