package com.phangwilly.portfolio.repository;

import com.phangwilly.portfolio.model.UserSession;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

  @EntityGraph(attributePaths = "user")
  Optional<UserSession> findByTokenHash(String tokenHash);

  @Modifying
  @Query("""
    update UserSession s
    set s.expiredAt = :expiredAt
    where s.user.id = :userId
      and s.tokenHash <> :currentTokenHash
      and s.expiredAt > :expiredAt
    """)
  int expireOtherSessions(
    @Param("userId") UUID userId,
    @Param("currentTokenHash") String currentTokenHash,
    @Param("expiredAt") Instant expiredAt
  );

  @Modifying
  @Query("""
    update UserSession s
    set s.expiredAt = :expiredAt
    where s.user.id = :userId
      and s.expiredAt > :expiredAt
    """)
  int expireAllUserSessions(
    @Param("userId") UUID userId,
    @Param("expiredAt") Instant expiredAt
  );
}
