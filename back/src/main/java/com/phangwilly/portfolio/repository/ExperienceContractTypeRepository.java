package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.ExperienceContractType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ExperienceContractTypeRepository extends JpaRepository<ExperienceContractType, UUID> {

  Optional<ExperienceContractType> findByIdAndDeletedAtIsNull(UUID id);

  List<ExperienceContractType> findBySlugAndDeletedAtIsNull(String slug);

  boolean existsBySlugAndLangAndDeletedAtIsNull(String slug, String lang);

  boolean existsByCodeAndDeletedAtIsNull(String code);

  @Query(
    value = """
    SELECT DISTINCT c.slug FROM ExperienceContractType c
    WHERE c.deletedAt IS NULL
    ORDER BY c.slug ASC
    """,
    countQuery = """
    SELECT COUNT(DISTINCT c.slug) FROM ExperienceContractType c
    WHERE c.deletedAt IS NULL
    """
  )
  Page<String> findDistinctActiveSlugs(Pageable pageable);
}
